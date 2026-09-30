# Google XYZ scaffolds — FlowBoard

Fill these later for resume bullets. **Do not** treat as polished bullets.

Format reminder: **X** = accomplished [action] · **Y** = measured by [metric] · **Z** = by [method/stack]

Evidence grades from `docs/METRICS.md`: prefer A/B only in final resume lines.

---

## Scaffold 1 — Tenant isolation

- **X:** _____ (e.g. enforced workspace membership on REST resources so outsiders cannot read/write foreign tenants)
- **Y:** _____ (e.g. integration tests asserting HTTP 403 for non-members on workspace + document routes — count: __)
- **Z:** _____ (e.g. FastAPI deps `get_workspace_member` + SQLAlchemy member lookup; see `test_non_member_*`)
- **Evidence IDs:** C2, C3 · Grade A
- **Status:** worksheet only

## Scaffold 2 — WebSocket fail-closed

- **X:** _____ (e.g. gated realtime workspace channels so a valid JWT cannot subscribe to another tenant’s events)
- **Y:** _____ (e.g. membership helper true for owner / false for outsider; close code 4003 path in handler)
- **Z:** _____ (e.g. JWT `type==access` + `workspace_members` query before `websocket.accept`)
- **Evidence IDs:** C4, C5 · Grade A/B
- **Status:** worksheet only

## Scaffold 3 — Auth hardening

- **X:** _____ (e.g. hardened password hashing / validation so long passwords and bad login bodies fail safely)
- **Y:** _____ (e.g. Argon2 verify for 100+ byte passwords; >1000 char → 422; malformed login → 422 not 500)
- **Z:** _____ (e.g. passlib Argon2, Pydantic validators, FastAPI `jsonable_encoder` validation handler)
- **Evidence IDs:** C6, C7, C8 · Grade A
- **Status:** worksheet only

## Scaffold 4 — Kanban ordering correctness

- **X:** _____ (e.g. fixed task position allocation so sequential creates get monotonic positions)
- **Y:** _____ (e.g. regression test expects positions 0 then 1 — previously both 0 under `or -1`)
- **Z:** _____ (e.g. `max(position) is None` guard in `task_service.create_task`; sibling reindex on move)
- **Evidence IDs:** C9 · Grade A
- **Status:** worksheet only

## Scaffold 5 — Realtime publish path

- **X:** _____ (e.g. published board mutations to a per-workspace Redis channel for live clients)
- **Y:** _____ (e.g. move-task integration asserts `redis.publish` invoked)
- **Z:** _____ (e.g. `publish_event` → `ws:workspace:{id}`; ConnectionManager + Celery/Redis stack)
- **Evidence IDs:** C10 · Grade A
- **Caveat:** Do not fill Y with QPS/latency until a harness exists (METRICS goals = PROPOSED).
- **Status:** worksheet only

## Scaffold 6 — Verification culture

- **X:** _____ (e.g. established a reproducible backend proof suite for multi-tenant behaviors)
- **Y:** _____ (e.g. **59** passed / **0** failed on Postgres 16 + Redis 7)
- **Z:** _____ (e.g. pytest-asyncio + httpx ASGITransport; CI workflow `test-backend`)
- **Evidence IDs:** C1 · Grade A
- **Status:** worksheet only

---

## Fill checklist before promoting to resume

- [ ] Exact number matches latest `docs/evidence/pytest-summary.txt`
- [ ] No “production” / SES / ECS language
- [ ] Demo URL not cited as load-test proof
- [ ] Z names real files/functions you can open in an interview
