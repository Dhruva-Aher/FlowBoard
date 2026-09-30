# Interview Guide — FlowBoard

## 30-second pitch

I built FlowBoard, a multi-tenant workspace with boards and docs. The interesting part isn’t the Kanban UI — it’s **fail-closed tenant isolation**: REST membership checks, a role matrix, WebSockets that refuse non-members even with a valid JWT, and tests that lock those behaviors in (59 backend cases).

## Own the hard parts (steal these threads)

### 1. Multi-tenant authz

- **What:** `get_workspace_member` + `has_permission` / `require_permission`.
- **Ask me:** How does a task ID map back to a workspace? (`task → project → workspace_id → member row`)
- **Trap:** Claiming “RBAC” when only an enum exists — point at `PERMISSIONS` dict and viewer deny tests.

### 2. WebSocket fail-closed

- **What:** Decode JWT → require `type==access` → `_is_workspace_member` → else close **4003** → only then `accept`.
- **Ask me:** Why JWT alone is insufficient for room IDs.
- **Trap:** Don’t claim CRDT/OT collaborative editing — docs are TipTap JSON autosave + “doc.updated” events, not Google Docs sync.

### 3. Ordering / move

- **What:** Integer positions; move reindexes siblings; create uses `max(position)` with **`is None`** (not `or -1`).
- **Ask me:** What bug `x or -1` causes when `x == 0`.
- **Trap:** Don’t claim conflict-free concurrent drag under partition without a protocol — current design is last-write + broadcast.

### 4. Auth edges

- Argon2 (and bcrypt verify fallback), refresh revoke-on-rotate, HttpOnly refresh cookie path, validation **422** without password in error body.
- **Trap:** Refresh endpoint currently also depends on `get_current_user` (access token) — know this quirk; don’t call it “refresh-only OAuth.”

### 5. Realtime path

- Publish: `realtime_service.publish_event` → Redis `ws:workspace:{id}`.
- Subscribe: per-connection Redis pubsub task → in-process room broadcast.
- **Trap:** Don’t quote QPS; proof is “publish called on move” + architecture, not load test.

## Likely interviewer challenges

| Challenge | Honest answer |
|-----------|----------------|
| “Is this production?” | Local/compose demo; CI tests; no public deploy claimed. |
| “Horizontal WS scale?” | Redis pubsub is the cross-process bridge; sticky sessions / connection limits not measured. |
| “Why not Supabase?” | Wanted explicit authz and WS gating in application code for interview depth. |
| “Frontend tests?” | Typecheck in CI; no RTL suite yet. |

## Do-not-say list (depth docs only)

- production-grade / live at scale / SES emails working / ECS deploy
- p99 latency, “handles thousands of concurrent users”
- “full CRDT collaboration”
- polished resume bullets pulled from XYZ without filling Z evidence

## Code tour map

| Topic | Path |
|-------|------|
| Permissions | `backend/app/core/permissions.py` |
| Auth deps | `backend/app/api/deps.py` |
| WS gate | `backend/app/websocket/handler.py` |
| Task order / move | `backend/app/services/task_service.py`, `crud/task.py` |
| Publish | `backend/app/services/realtime_service.py` |
| Tests | `backend/tests/integration/*`, `unit/*` |
