# Positioning — FlowBoard

## One-liner

FlowBoard is a multi-tenant team workspace (boards + docs) where **tenant isolation and fail-closed authz** are first-class — not a Kanban UI bolted onto an open API.

## Job to be done

Let a small team share projects, ordered boards, and rich docs with role-aware access and live updates, without leaking another workspace’s events or data.

## Recruiter attention hook (affirmative)

**Built the multi-tenant hard parts:** RBAC on REST, membership-gated WebSockets, Argon2 auth, and correct Kanban ordering — backed by a **59-test** backend suite.

## Peers this must not look like

| Peer pattern | What they usually ship | What FlowBoard owns instead |
|--------------|------------------------|-----------------------------|
| Tutorial Trello clone | Single-user board, JWT optional, no tenants | Workspace members + role matrix on mutations |
| “WebSocket chat” demo | Any token joins any room | JWT **and** membership check before accept (`4003`) |
| Firebase/Supabase Kanban | Rules in the BaaS, thin client | Explicit FastAPI deps + SQL membership joins |
| CRUD SaaS with “RBAC enum” | Enum never enforced on all routes | Permissions map + tests for viewer/member/admin/owner |
| Notebook “realtime” | In-process broadcast only | Redis pub/sub channel per workspace + publish on task move |

## Differentiator depth (interview)

1. **Tenant fail-closed:** `get_workspace_member` / resource→project→workspace walks; outsiders get **403**.
2. **Realtime same boundary:** WS handler validates access token type, then `_is_workspace_member` before `accept`.
3. **Ordering correctness:** `max(position) is None` handling — fixed the classic `or -1` bug that collapses all positions to 0.
4. **Auth edge cases:** Argon2 (no 72-byte silent truncate); validation errors stay **422** without leaking bodies as **500**.
5. **Honest scope:** Celery/SES/S3 and AWS deploy are code-complete stubs or aspirational — not resume metrics.

## Demo vs proof

- **Demo:** Compose UI at `:5173` for UX walkthrough.
- **Proof:** pytest + Postgres/Redis; numbers in README come only from proof.
