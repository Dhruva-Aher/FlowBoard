import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "new@example.com", "name": "New User", "password": "password123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client, registered_user):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "name": "Dup", "password": "password123"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "weak@example.com", "name": "Weak", "password": "short"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_long_password_succeeds(client):
    """Passwords up to 1000 chars should register without crashing (no bcrypt 72-byte limit)."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "longpw@example.com",
            "name": "Long PW User",
            "password": "x" * 100,  # well beyond bcrypt's 72-byte limit
        },
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_register_password_too_long_returns_422(client):
    """Passwords over 1000 chars must be rejected with 422, not a 500."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "huge@example.com",
            "name": "DoS Attempt",
            "password": "a" * 1001,
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_after_long_password_registration(client):
    """Login must succeed when the stored hash was created from a long password."""
    long_pw = "secure-long-passphrase-" * 5  # 115 bytes
    await client.post(
        "/api/v1/auth/register",
        json={"email": "longlogin@example.com", "name": "LongLogin", "password": long_pw},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "longlogin@example.com", "password": long_pw},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_success(client, registered_user):
    # Login uses OAuth2PasswordRequestForm: form-encoded, field name `username`.
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client, registered_user):
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "wrong_password"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client):
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "nobody@example.com", "password": "password123"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_missing_fields_returns_422_not_500(client):
    """Sending JSON (wrong content type) must return 422, never 500."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    # FastAPI can't parse JSON as OAuth2PasswordRequestForm → 422, not 500.
    assert resp.status_code == 422
    assert resp.json()["detail"]  # error list is present and non-empty


@pytest.mark.asyncio
async def test_login_empty_body_returns_422_not_500(client):
    """Sending a raw non-form body must never cause an unhandled 500."""
    resp = await client.post(
        "/api/v1/auth/login",
        content=b"not valid form data",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_me(client, auth_headers):
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout(client, auth_headers, registered_user):
    # First login to get a refresh token cookie
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"},
    )
    assert login_resp.status_code == 200
    refresh_token = login_resp.cookies.get("refresh_token")

    resp = await client.post("/api/v1/auth/logout", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["message"] == "Logged out successfully"
