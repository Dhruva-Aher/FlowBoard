import os
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.database import Base, get_db
from app.main import app as fastapi_app
from app.redis import get_redis

# Ensure all models register on Base.metadata before create_all.
# Use importlib so we do not rebind the name `app` (package) over the FastAPI instance.
import importlib

importlib.import_module("app.models")

TEST_DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/test_flowboard",
)


@pytest_asyncio.fixture
async def engine():
    """Function-scoped engine (NullPool) avoids cross-loop asyncpg futures."""
    eng = create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        # Truncate all tables so the next test starts clean without DROP races.
        table_names = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
        if table_names:
            await conn.execute(text(f"TRUNCATE {table_names} RESTART IDENTITY CASCADE"))
    await eng.dispose()


@pytest.fixture
def mock_redis():
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock()
    redis.delete = AsyncMock()
    redis.publish = AsyncMock()
    redis.hset = AsyncMock()
    redis.expire = AsyncMock()
    redis.hdel = AsyncMock()
    return redis


@pytest_asyncio.fixture
async def client(engine, mock_redis):
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    fastapi_app.dependency_overrides[get_db] = override_get_db
    fastapi_app.dependency_overrides[get_redis] = lambda: mock_redis
    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as ac:
        yield ac
    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def registered_user(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "name": "Test User", "password": "password123"},
    )
    assert resp.status_code == 200
    return resp.json()


@pytest_asyncio.fixture
async def auth_headers(client, registered_user):
    # Login endpoint uses OAuth2PasswordRequestForm (form-encoded, field `username`).
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
