"""Redis client with NullRedis fallback for Vercel demos without Upstash."""
from __future__ import annotations

import logging
from typing import Any
from unittest.mock import AsyncMock

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)


def _build_null_redis() -> AsyncMock:
    """Async no-op that satisfies publish / presence / cache call sites."""
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)
    redis.delete = AsyncMock(return_value=0)
    redis.publish = AsyncMock(return_value=0)
    redis.hset = AsyncMock(return_value=1)
    redis.expire = AsyncMock(return_value=True)
    redis.hdel = AsyncMock(return_value=0)
    redis.pubsub = AsyncMock()
    return redis


def _build_client() -> Any:
    if not settings.redis_enabled:
        logger.warning(
            "REDIS_URL unset — using NullRedis (realtime/presence no-ops). "
            "Compose + Upstash remain the proof path for pub/sub."
        )
        return _build_null_redis()
    return aioredis.from_url(
        settings.REDIS_URL, encoding="utf-8", decode_responses=True
    )


redis_client = _build_client()


async def get_redis() -> Any:
    return redis_client
