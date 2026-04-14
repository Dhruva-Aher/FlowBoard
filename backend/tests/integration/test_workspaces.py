import pytest


@pytest.mark.asyncio
async def test_create_workspace(client, auth_headers):
    resp = await client.post(
        "/api/v1/workspaces",
        json={"name": "My Team", "slug": "my-team"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "My Team"
    assert data["slug"] == "my-team"


@pytest.mark.asyncio
async def test_list_workspaces(client, auth_headers):
    await client.post(
        "/api/v1/workspaces",
        json={"name": "WS1", "slug": "ws1-list-test"},
        headers=auth_headers,
    )
    resp = await client.get("/api/v1/workspaces", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_duplicate_slug_rejected(client, auth_headers):
    await client.post(
        "/api/v1/workspaces",
        json={"name": "WS", "slug": "unique-slug-xyz"},
        headers=auth_headers,
    )
    resp = await client.post(
        "/api/v1/workspaces",
        json={"name": "WS2", "slug": "unique-slug-xyz"},
        headers=auth_headers,
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_non_member_cannot_access_workspace(client, auth_headers):
    create_resp = await client.post(
        "/api/v1/workspaces",
        json={"name": "Private", "slug": "private-ws-test"},
        headers=auth_headers,
    )
    ws_id = create_resp.json()["id"]

    # Register a new user
    await client.post(
        "/api/v1/auth/register",
        json={"email": "other@example.com", "name": "Other", "password": "password123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "other@example.com", "password": "password123"},
    )
    other_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    resp = await client.get(f"/api/v1/workspaces/{ws_id}", headers=other_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_workspace(client, auth_headers):
    create_resp = await client.post(
        "/api/v1/workspaces",
        json={"name": "Get Test", "slug": "get-test-ws"},
        headers=auth_headers,
    )
    ws_id = create_resp.json()["id"]
    resp = await client.get(f"/api/v1/workspaces/{ws_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == ws_id


@pytest.mark.asyncio
async def test_list_workspaces_requires_auth(client):
    resp = await client.get("/api/v1/workspaces")
    assert resp.status_code == 401
