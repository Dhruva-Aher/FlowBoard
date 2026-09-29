# FlowBoard

Multi-tenant collaborative workspace: JWT/RBAC isolation, Kanban with ordered tasks, TipTap docs, and Redis-backed realtime — built for Backend / Full-stack interviews.

**Demo:** Vercel public URL — see [`docs/DEPLOY.md`](docs/DEPLOY.md) (after Neon + Git link)  
**Local:** `docker compose up --build` → http://localhost:5173 · API http://localhost:8000/docs  
**Proof:** `pytest` against Postgres/Redis — **not** the Vercel demo numbers

[![Backend Tests](https://github.com/Dhruva-Aher/FlowBoard/actions/workflows/ci.yml/badge.svg)](https://github.com/Dhruva-Aher/FlowBoard/actions/workflows/ci.yml)

## Outcomes (verified)

| Outcome | Metric | Evidence |
|--------|--------|----------|
| Backend suite green | **59** pytest cases, **0** failures (~15s) | [`docs/evidence/pytest-summary.txt`](docs/evidence/pytest-summary.txt) · Grade A* |
| Fail-closed tenant gate | Non-member → **403** on workspace/docs; WS membership denied for outsiders | `tests/integration/test_*` |
| Auth hardening | Argon2; passwords **>72 bytes** OK; **>1000** → **422** | security + auth tests |
| Kanban order correctness | Positions **0, 1, …** (`is None` not `or -1`) | `test_task_position_auto_assigned` |
| Realtime publish path | Task move → Redis publish (Compose/proof) | `test_move_task_publishes_ws_event` |
| Public demo target | Vercel Services (Vite + FastAPI) | `vercel.json` · deploy Grade **pending** until Neon URL live |

\*Re-stamp evidence after commit so SHA matches.
## Architecture (short)

```
React/TS (Vite) ──REST/WS──► FastAPI (async SQLAlchemy)
                                │
                     ┌──────────┼──────────┐
                     ▼          ▼          ▼
                PostgreSQL    Redis     Celery worker
              (tenants/RBAC) (pubsub/   (email/export
                              presence)  stubs → AWS*)
```

\*Celery tasks for SES/S3 are implemented; they need real AWS credentials — not claimed as a live notification system.

**Owned hard parts vs typical Kanban tutorials:** workspace membership on every resource path; role matrix (owner/admin/member/viewer); WebSocket **JWT + membership** before accept (close **4003** if outsider); refresh-token revoke-on-rotate; ProseMirror JSON contract for TipTap; integer task ordering without the falsy-`0` trap.

## Quick start

```bash
cp .env.example .env
docker compose up --build
# Frontend http://localhost:5173 · API http://localhost:8000/docs
```

```bash
cd backend && pip install -r requirements-dev.txt
# Postgres + Redis required (compose or local)
pytest tests/ -v
```

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Vercel Services deploy + Neon/Upstash |
| [`docs/METRICS.md`](docs/METRICS.md) | Claim table, grades, demo vs proof |
| [`docs/POSITIONING.md`](docs/POSITIONING.md) | Differentiator vs peers |
| [`docs/INTERVIEW_GUIDE.md`](docs/INTERVIEW_GUIDE.md) | Talking points + traps |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Product/design/honesty decisions |
| [`docs/resume/XYZ_SCAFFOLDS.md`](docs/resume/XYZ_SCAFFOLDS.md) | Google XYZ worksheets (not polished bullets) |

## Stack

FastAPI · async SQLAlchemy · PostgreSQL · Redis pub/sub · Celery · React + TypeScript · Zustand · TanStack Query · TipTap · dnd-kit · Docker Compose · GitHub Actions

## Author

Dhruva Aher · [GitHub](https://github.com/Dhruva-Aher) · [LinkedIn](https://linkedin.com/in/dhruva-aher)
