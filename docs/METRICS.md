# Metrics & Claims — FlowBoard

**Category:** full-stack SaaS (multi-tenant collaboration)  
**Target roles:** Backend, Full-stack  
**Demo environment:** https://flowboard-iota-blond.vercel.app (Vercel + Neon; Redis NullRedis)  
**Proof environment:** `pytest` against PostgreSQL 16 + Redis 7 (same schema as app)

Demo and proof are **not** mixed: no latency/throughput numbers from the UI demo.

Evidence grades: **A** = artifact/command for this tree · **B** = reproducible harness · **C** = historical documented run · **D** = design target only

## Claim table

| ID | Claim (exact) | Name / unit / window | Grade | Evidence |
|----|---------------|----------------------|-------|----------|
| C1 | Backend test suite: **62 collected** (unit+integration; re-run for pass count) | count; `pytest tests/ --collect-only` | A | `docs/evidence/source-size.txt` + prior `pytest-summary.txt` (59 pass before URL normalize tests) |
| C2 | Non-member cannot read another workspace | HTTP **403** | A | `test_non_member_cannot_access_workspace` |
| C3 | Non-member cannot patch another workspace’s doc | HTTP **403** | A | `test_non_member_cannot_update_document` |
| C4 | WS membership helper: owner → true, outsider → false | boolean gate before WS accept | A | `test_member_true_after_workspace_create`, `test_outsider_is_not_member` |
| C5 | Invalid / missing JWT on WS → reject | close path / no accept | B | handler `4001`; unit covers token `type==access` |
| C6 | Argon2 verifies passwords longer than bcrypt’s 72-byte limit | hash+verify for 100-byte and 112-byte inputs | A | `test_password_beyond_72_bytes_*`, `test_register_long_password_*` |
| C7 | Password >1000 chars → **422**, not **500** | validation bound | A | `test_register_password_too_long_returns_422` |
| C8 | Malformed login body → **422**, not **500** | JSONable validation errors | A | `test_login_missing_fields_returns_422_not_500` |
| C9 | Second task in a column gets `position == 1` | ordering after create | A | `test_task_position_auto_assigned` (+ fix for `or -1`) |
| C10 | Task move publishes Redis channel event | `mock_redis.publish` called | A | `test_move_task_publishes_ws_event` |
| C11 | New docs store TipTap/ProseMirror `{type:"doc", content:[...]}` | schema contract | A | `test_create_document_returns_valid_tiptap_content` |
| C12 | RBAC matrix: viewer read-only; member cannot delete workspace; admin cannot change roles | permission set lookup | A | `tests/unit/test_permissions.py` (5 cases) |
| C13 | Refresh tokens unique; verify round-trip | cryptographic uniqueness | A | `test_refresh_tokens_are_unique`, `test_refresh_token_verify` |
| C14 | Access token expires (15 min config) | JWT `exp` enforced | A | `test_access_token_expired` (freezegun +20 min) |
| C15 | Public Vercel demo: SPA **200**, `/health` **ok**, register→workspace→project **200** | HTTPS `flowboard-iota-blond.vercel.app`; redis `null` | A | `docs/evidence/vercel-prod-smoke.txt` (2026-09-29) |
| C16 | Prod `GET /health` p50 **~130ms** (n=5) | ms; Vercel→Neon window 2026-09-29 | A | `docs/evidence/prod-api-latency.txt` |
| C17 | Prod `GET /` SPA p50 **~48ms** (n=5) | ms; same window | A | `docs/evidence/prod-api-latency.txt` |
| C18 | Prod register (single) **~616ms**; `/auth/me` p50 **~189ms**; create workspace **~309ms** | ms; Argon2+DB on serverless | A | `docs/evidence/prod-api-latency.txt` |
| C19 | Source inventory: backend app **3133** LOC · frontend src **6563** LOC · **62** pytest cases | lines / count | A | `docs/evidence/source-size.txt` |

## Explicit non-claims (do not pitch)

| Phrase | Why dropped / corrected |
|--------|-------------------------|
| “production-grade” / “production SaaS” | Demo is Vercel+Neon when live; not a measured multi-region product |
| Landing “12,000+ teams / 500K tasks / 99.9% SLA” | **Removed** — fabricated marketing |
| “live multi-client collaboration on Vercel” | Redis optional; NullRedis demo has no cross-client pub/sub |
| “email notifications via SES” / “S3 exports live” | Celery not run on Vercel |
| Exact multi-region p99 / sustained QPS | C16–C18 are single-client warm samples only — not capacity claims |
| Frontend “unit test coverage” | No `*.test.ts(x)` files; CI typecheck only |

## How to re-verify (Grade B harness)

```bash
# Proof env
docker compose up -d postgres redis   # or local Postgres 16 + Redis 7
cd backend && pip install -r requirements-dev.txt
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/test_flowboard
export DATABASE_URL_SYNC=postgresql://postgres:postgres@localhost:5432/test_flowboard
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=test-secret-key-for-ci-only
export REFRESH_SECRET_KEY=test-refresh-secret-key-for-ci-only
export ENVIRONMENT=test
createdb test_flowboard  # once
pytest tests/ -v
```

## Goals (not yet measured)

| Goal | Unit | Method (proposed) | Status |
|------|------|-------------------|--------|
| WS fanout latency under N clients | p50/p95 ms | local harness publishing N events | **PROPOSED** |
| Board load for 500 tasks | p95 ms | API timing script | **PROPOSED** |
