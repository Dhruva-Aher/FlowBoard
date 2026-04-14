import json
from datetime import datetime, timezone
import redis.asyncio as aioredis


async def publish_event(
    redis: aioredis.Redis,
    workspace_id: str,
    event: str,
    payload: dict,
    actor: dict,
) -> None:
    message = json.dumps({
        "event": event,
        "actor": actor,
        "payload": payload,
        "workspace_id": workspace_id,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    await redis.publish(f"ws:workspace:{workspace_id}", message)
