from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError
from app.core.security import decode_access_token
from app.websocket.manager import manager
from app.redis import redis_client
import asyncio
import json

router = APIRouter()


@router.websocket("/ws/workspace/{workspace_id}")
async def workspace_websocket(
    websocket: WebSocket,
    workspace_id: str,
    token: str = Query(...),
):
    # Validate JWT
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, workspace_id)

    # Start Redis subscriber for this workspace in background
    subscriber_task = asyncio.create_task(
        manager.subscribe_redis(redis_client, workspace_id)
    )

    # Update presence
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
                # Refresh presence TTL
                await redis_client.expire(f"ws:presence:{workspace_id}", 60)
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        pass
    finally:
        subscriber_task.cancel()
        manager.disconnect(websocket, workspace_id)
        await redis_client.hdel(f"ws:presence:{workspace_id}", user_id)
