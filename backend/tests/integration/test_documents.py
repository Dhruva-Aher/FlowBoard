"""Integration tests for the documents feature."""
import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _make_workspace(client, auth_headers, slug: str) -> str:
    resp = await client.post(
        "/api/v1/workspaces",
        json={"name": "Doc WS", "slug": slug},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    return resp.json()["id"]


async def _make_doc(client, auth_headers, workspace_id: str, title: str = "Test Doc") -> dict:
    resp = await client.post(
        f"/api/v1/workspaces/{workspace_id}/docs",
        json={"title": title},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    return resp.json()


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_document_returns_valid_tiptap_content(client, auth_headers):
    """New documents must store valid ProseMirror JSON, not a bare {}."""
    ws_id = await _make_workspace(client, auth_headers, "doc-create-1")
    doc = await _make_doc(client, auth_headers, ws_id)

    assert doc["title"] == "Test Doc"
    content = doc["content"]
    # Must be a valid TipTap/ProseMirror document
    assert content.get("type") == "doc", (
        "content must be a ProseMirror doc object, not bare {}"
    )
    assert isinstance(content.get("content"), list)
    assert len(content["content"]) >= 1


@pytest.mark.asyncio
async def test_create_document_default_title(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-create-2")
    resp = await client.post(
        f"/api/v1/workspaces/{ws_id}/docs",
        json={},          # no title → uses default "Untitled"
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Untitled"


@pytest.mark.asyncio
async def test_create_document_requires_auth(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-create-3")
    resp = await client.post(
        f"/api/v1/workspaces/{ws_id}/docs",
        json={"title": "Private"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_documents(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-list-1")
    await _make_doc(client, auth_headers, ws_id, "Alpha")
    await _make_doc(client, auth_headers, ws_id, "Beta")

    resp = await client.get(
        f"/api/v1/workspaces/{ws_id}/docs",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    titles = [d["title"] for d in resp.json()]
    assert "Alpha" in titles
    assert "Beta" in titles


@pytest.mark.asyncio
async def test_list_documents_requires_auth(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-list-2")
    resp = await client.get(f"/api/v1/workspaces/{ws_id}/docs")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Get
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_document(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-get-1")
    created = await _make_doc(client, auth_headers, ws_id, "My Doc")

    resp = await client.get(f"/api/v1/docs/{created['id']}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == created["id"]
    assert data["title"] == "My Doc"
    # Content must be valid ProseMirror JSON
    assert data["content"].get("type") == "doc"


@pytest.mark.asyncio
async def test_get_nonexistent_document_returns_404(client, auth_headers):
    resp = await client.get(
        "/api/v1/docs/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Update — title
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_document_title(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-update-title-1")
    doc = await _make_doc(client, auth_headers, ws_id)

    resp = await client.patch(
        f"/api/v1/docs/{doc['id']}",
        json={"title": "Renamed Title"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Renamed Title"


@pytest.mark.asyncio
async def test_update_document_title_persists(client, auth_headers):
    """A re-fetch after patching must return the updated title."""
    ws_id = await _make_workspace(client, auth_headers, "doc-update-title-2")
    doc = await _make_doc(client, auth_headers, ws_id, "Original")

    await client.patch(
        f"/api/v1/docs/{doc['id']}",
        json={"title": "Updated"},
        headers=auth_headers,
    )
    refetch = await client.get(f"/api/v1/docs/{doc['id']}", headers=auth_headers)
    assert refetch.json()["title"] == "Updated"


# ---------------------------------------------------------------------------
# Update — content
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_document_content(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-update-content-1")
    doc = await _make_doc(client, auth_headers, ws_id)

    new_content = {
        "type": "doc",
        "content": [
            {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Hello"}]},
            {"type": "paragraph", "content": [{"type": "text", "text": "World"}]},
        ],
    }
    resp = await client.patch(
        f"/api/v1/docs/{doc['id']}",
        json={"content": new_content},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["content"] == new_content


@pytest.mark.asyncio
async def test_update_document_content_persists(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-update-content-2")
    doc = await _make_doc(client, auth_headers, ws_id)

    new_content = {
        "type": "doc",
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Persisted"}]}],
    }
    await client.patch(
        f"/api/v1/docs/{doc['id']}",
        json={"content": new_content},
        headers=auth_headers,
    )
    refetch = await client.get(f"/api/v1/docs/{doc['id']}", headers=auth_headers)
    assert refetch.json()["content"] == new_content


@pytest.mark.asyncio
async def test_update_sets_last_edited_by(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-update-editor-1")
    doc = await _make_doc(client, auth_headers, ws_id)
    assert doc["last_edited_by"] is None  # fresh doc has no editor yet

    resp = await client.patch(
        f"/api/v1/docs/{doc['id']}",
        json={"title": "Edited"},
        headers=auth_headers,
    )
    assert resp.json()["last_edited_by"] is not None


# ---------------------------------------------------------------------------
# Update — auth / permissions
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_document_requires_auth(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-update-auth-1")
    doc = await _make_doc(client, auth_headers, ws_id)
    resp = await client.patch(f"/api/v1/docs/{doc['id']}", json={"title": "X"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_non_member_cannot_update_document(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-update-perm-1")
    doc = await _make_doc(client, auth_headers, ws_id)

    # Register a second user
    await client.post(
        "/api/v1/auth/register",
        json={"email": "other_doc@example.com", "name": "Other", "password": "password123"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "other_doc@example.com", "password": "password123"},
    )
    other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    resp = await client.patch(
        f"/api/v1/docs/{doc['id']}",
        json={"title": "Hijacked"},
        headers=other_headers,
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_document(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-delete-1")
    doc = await _make_doc(client, auth_headers, ws_id)

    resp = await client.delete(f"/api/v1/docs/{doc['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["message"] == "Document deleted successfully"

    # Must be gone
    get_resp = await client.get(f"/api/v1/docs/{doc['id']}", headers=auth_headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_document_requires_auth(client, auth_headers):
    ws_id = await _make_workspace(client, auth_headers, "doc-delete-2")
    doc = await _make_doc(client, auth_headers, ws_id)
    resp = await client.delete(f"/api/v1/docs/{doc['id']}")
    assert resp.status_code == 401
