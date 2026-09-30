"""WebSocket fail-closed authz: JWT + workspace membership required."""
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.security import create_access_token
from app.websocket import handler as ws_handler


@pytest.mark.asyncio
async def test_is_workspace_member_rejects_invalid_uuids():
    assert await ws_handler._is_workspace_member("not-a-uuid", str(uuid4())) is False
    assert await ws_handler._is_workspace_member(str(uuid4()), "also-bad") is False


@pytest.mark.asyncio
async def test_is_workspace_member_false_for_unknown_pair(engine, monkeypatch):
    """Unknown IDs are not members — uses test engine to avoid loop-bound global pool."""
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(ws_handler, "AsyncSessionLocal", session_factory)
    assert await ws_handler._is_workspace_member(str(uuid4()), str(uuid4())) is False


@pytest.mark.asyncio
async def test_member_true_after_workspace_create(client, auth_headers, engine, monkeypatch):
    """Owner created via API must be recognized as a workspace member."""
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(ws_handler, "AsyncSessionLocal", session_factory)

    resp = await client.post(
        "/api/v1/workspaces",
        json={"name": "WS Gate", "slug": "ws-gate-check"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    workspace_id = resp.json()["id"]

    me = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert me.status_code == 200
    user_id = me.json()["id"]

    assert await ws_handler._is_workspace_member(user_id, workspace_id) is True


@pytest.mark.asyncio
async def test_outsider_is_not_member(client, auth_headers, engine, monkeypatch):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(ws_handler, "AsyncSessionLocal", session_factory)

    resp = await client.post(
        "/api/v1/workspaces",
        json={"name": "Private", "slug": "ws-gate-private"},
        headers=auth_headers,
    )
    workspace_id = resp.json()["id"]

    await client.post(
        "/api/v1/auth/register",
        json={"email": "outsider-gate@example.com", "name": "Out", "password": "password123"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "outsider-gate@example.com", "password": "password123"},
    )
    outsider_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    outsider_me = await client.get("/api/v1/auth/me", headers=outsider_headers)
    outsider_id = outsider_me.json()["id"]

    assert await ws_handler._is_workspace_member(outsider_id, workspace_id) is False


def test_access_token_type_claim_present():
    """WS handler requires payload type == access; token helper must set it."""
    from jose import jwt
    from app.config import settings

    token = create_access_token("user-abc")
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert payload["type"] == "access"
    assert payload["sub"] == "user-abc"
