import asyncio
import json
from collections import defaultdict
from fastapi import WebSocket
import redis.asyncio as aioredis


class ConnectionManager:
    def __init__(self):
        # workspace_id -> set of WebSocket connections
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, workspace_id: str):
        await websocket.accept()
        self._rooms[workspace_id].add(websocket)

    def disconnect(self, websocket: WebSocket, workspace_id: str):
        self._rooms[workspace_id].discard(websocket)

    async def broadcast(self, workspace_id: str, message: str, exclude: WebSocket | None = None):
        dead = set()
        for ws in self._rooms[workspace_id]:
            if ws is exclude:
                continue
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._rooms[workspace_id].discard(ws)

    async def subscribe_redis(self, redis: aioredis.Redis, workspace_id: str):
        """Subscribe to Redis channel and forward messages to WS room."""
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"ws:workspace:{workspace_id}")
        async for message in pubsub.listen():
            if message["type"] == "message":
                await self.broadcast(workspace_id, message["data"])


manager = ConnectionManager()
