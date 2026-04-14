import pytest


@pytest.fixture
async def workspace_and_project(client, auth_headers):
    ws = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test WS", "slug": "test-ws-tasks"},
        headers=auth_headers,
    )
    ws_id = ws.json()["id"]
    proj = await client.post(
        f"/api/v1/workspaces/{ws_id}/projects",
        json={"name": "Test Project"},
        headers=auth_headers,
    )
    proj_id = proj.json()["id"]
    col = await client.post(
        f"/api/v1/projects/{proj_id}/columns",
        json={"name": "To Do", "position": 0},
        headers=auth_headers,
    )
    return {"ws_id": ws_id, "proj_id": proj_id, "col_id": col.json()["id"]}


@pytest.mark.asyncio
async def test_create_task(client, auth_headers, workspace_and_project):
    data = await workspace_and_project
    resp = await client.post(
        f"/api/v1/columns/{data['col_id']}/tasks",
        json={"title": "Fix bug #123", "priority": "high"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Fix bug #123"
    assert resp.json()["priority"] == "high"


@pytest.mark.asyncio
async def test_task_position_auto_assigned(client, auth_headers, workspace_and_project):
    data = await workspace_and_project
    resp1 = await client.post(
        f"/api/v1/columns/{data['col_id']}/tasks",
        json={"title": "First"},
        headers=auth_headers,
    )
    resp2 = await client.post(
        f"/api/v1/columns/{data['col_id']}/tasks",
        json={"title": "Second"},
        headers=auth_headers,
    )
    assert resp1.json()["position"] == 0
    assert resp2.json()["position"] == 1


@pytest.mark.asyncio
async def test_move_task_publishes_ws_event(client, auth_headers, workspace_and_project, mock_redis):
    data = await workspace_and_project
    task_resp = await client.post(
        f"/api/v1/columns/{data['col_id']}/tasks",
        json={"title": "Move me"},
        headers=auth_headers,
    )
    task_id = task_resp.json()["id"]

    col2_resp = await client.post(
        f"/api/v1/projects/{data['proj_id']}/columns",
        json={"name": "In Progress", "position": 1},
        headers=auth_headers,
    )
    col2_id = col2_resp.json()["id"]

    move_resp = await client.patch(
        f"/api/v1/tasks/{task_id}/move",
        json={"column_id": col2_id, "position": 0},
        headers=auth_headers,
    )
    assert move_resp.status_code == 200
    assert move_resp.json()["column_id"] == col2_id
    mock_redis.publish.assert_called()


@pytest.mark.asyncio
async def test_get_task(client, auth_headers, workspace_and_project):
    data = await workspace_and_project
    create_resp = await client.post(
        f"/api/v1/columns/{data['col_id']}/tasks",
        json={"title": "Get me"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["id"]
    resp = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == task_id


@pytest.mark.asyncio
async def test_update_task(client, auth_headers, workspace_and_project):
    data = await workspace_and_project
    create_resp = await client.post(
        f"/api/v1/columns/{data['col_id']}/tasks",
        json={"title": "Original"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["id"]
    resp = await client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Updated", "priority": "low"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated"
    assert resp.json()["priority"] == "low"


@pytest.mark.asyncio
async def test_delete_task(client, auth_headers, workspace_and_project):
    data = await workspace_and_project
    create_resp = await client.post(
        f"/api/v1/columns/{data['col_id']}/tasks",
        json={"title": "Delete me"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert resp.status_code == 200

    # Verify it's gone
    get_resp = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert get_resp.status_code == 404
