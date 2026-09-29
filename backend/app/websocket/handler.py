"""WebSocket workspace channel — JWT + membership fail-closed."""
import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError
from sqlalchemy import select

from app.config import settings
from app.core.security import decode_access_token
from app.database import AsyncSessionLocal
from app.models.workspace import WorkspaceMember
from app.redis import redis_client
from app.websocket.manager import manager

router = APIRouter()


async def _is_workspace_member(user_id: str, workspace_id: str) -> bool:
    """Return True only if user_id is an active member of workspace_id."""
    try:
        uid = UUID(user_id)
        wid = UUID(workspace_id)
    except ValueError:
        return False

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(WorkspaceMember.id).where(
                WorkspaceMember.workspace_id == wid,
                WorkspaceMember.user_id == uid,
            )
        )
        return result.scalar_one_or_none() is not None


@router.websocket("/ws/workspace/{workspace_id}")
async def workspace_websocket(
    websocket: WebSocket,
    workspace_id: str,
    token: str = Query(...),
):
    # 1) Validate JWT (fail-closed)
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id or payload.get("type") != "access":
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    # 2) Enforce workspace membership before accepting the socket (fail-closed).
    if not await _is_workspace_member(user_id, workspace_id):
        await websocket.close(code=4003)
        return

    await manager.connect(websocket, workspace_id)

    subscriber_task: asyncio.Task | None = None
    if settings.redis_enabled:
        subscriber_task = asyncio.create_task(
            manager.subscribe_redis(redis_client, workspace_id)
        )
        await redis_client.hset(
            f"ws:presence:{workspace_id}",
            user_id,
            json.dumps({"user_id": user_id, "active": True}),
        )
        await redis_client.expire(f"ws:presence:{workspace_id}", 60)

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                if settings.redis_enabled:
                    await redis_client.expire(f"ws:presence:{workspace_id}", 60)
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        pass
    finally:
        if subscriber_task is not None:
            subscriber_task.cancel()
        manager.disconnect(websocket, workspace_id)
        if settings.redis_enabled:
            await redis_client.hdel(f"ws:presence:{workspace_id}", user_id)
