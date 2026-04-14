import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.database import Base, get_db
from app.redis import get_redis
from unittest.mock import AsyncMock
import os

TEST_DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/test_flowboard",
)


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db(engine):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


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
async def client(db, mock_redis):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = lambda: mock_redis
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


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
