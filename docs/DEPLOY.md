# Deploy — FlowBoard on Vercel

**Demo environment** (this doc) ≠ **proof environment** (`pytest` + Compose).  
Do not cite Vercel uptime/latency as backend benchmarks.

## Production demo (VERIFIED)

| Item | Value |
|------|--------|
| **URL** | https://flowboard-iota-blond.vercel.app |
| **Stack** | Vercel Services (Vite + FastAPI) + Neon Postgres (`flowboard-db`) |
| **Redis** | unset → NullRedis (`/health` reports `"redis":"null"`) |
| **Project** | `flowboard` · `prj_XMzk6sV318n2GyIB0lloSZDDj0AD` |
| **Evidence** | `docs/evidence/vercel-prod-smoke.txt` (SPA, health, register, workspace, project, login) |

Realtime multi-client sync is **not** claimed on this demo until Upstash `REDIS_URL` is set.

## Historical: anonymous static preview

A claimable static-only temp deploy was used before Neon (expired; not production evidence). See `docs/evidence/vercel-frontend-temp.txt`.

## Architecture (DECIDED)

One Vercel project (`flowboard`) using **Vercel Services**:

| Service | Root | Runtime | Public routes |
|---------|------|---------|---------------|
| `frontend` | `frontend/` | Vite static | `/*` (SPA fallback) |
| `backend` | `backend/` | FastAPI | `/api/*`, `/ws/*`, `/health`, `/docs` |

Same-origin relative `/api/v1` + `/ws` from the SPA — no separate API hostname required for previews.

## Prerequisites (completed for prod above)

1. Own the Vercel project under your account (`dhruva-ahers-projects` / team that owns `prj_XMzk6sV318n2GyIB0lloSZDDj0AD`).
2. **(Optional)** Install the Vercel GitHub App on `Dhruva-Aher/FlowBoard` and link Git for auto-deploys: https://github.com/apps/vercel
3. Neon Postgres (Marketplace → Neon → `flowboard-db` connected). Env: `DATABASE_URL`.
4. **(Optional) Upstash Redis** for realtime pub/sub/presence. Without it the API uses **NullRedis**.
5. Secrets (Production + Preview):

| Key | Notes |
|-----|--------|
| `SECRET_KEY` | `openssl rand -hex 32` |
| `REFRESH_SECRET_KEY` | `openssl rand -hex 32` |
| `ENVIRONMENT` | `production` |
| `FRONTEND_URL` | `https://flowboard-iota-blond.vercel.app` |
| `CORS_ORIGINS` | optional extras; `*.vercel.app` already allowed by regex |
| `RUN_MIGRATIONS_ON_STARTUP` | `true` on first deploys |
| `DATABASE_URL` | from Neon (asyncpg normalized in code; `channel_binding` stripped) |
| `REDIS_URL` | from Upstash if used |
| `DATABASE_URL_SYNC` | optional; derived from `DATABASE_URL` if unset |

## Deploy commands

```bash
# After vercel login + link
npx vercel link --project flowboard --yes
npx vercel env pull .env.vercel --yes
npx vercel deploy          # preview
npx vercel deploy --prod   # production
```

Git push to the linked production branch also deploys once Git is connected.

## What works on the Vercel demo

- Landing, auth UI, boards, docs, RBAC REST (with Neon)
- OpenAPI at `/docs`, health at `/health`

## What is degraded / out of scope on Vercel

| Capability | Demo status | Proof path |
|------------|-------------|------------|
| Redis pub/sub + presence | Optional (NullRedis if unset) | Compose + Redis |
| Durable WebSocket fanout | Platform limits; not a load claim | Compose |
| Celery / SES / S3 | Not run on Vercel | Local worker + AWS creds |
| Fake “12k teams / 99.9% SLA” | **Removed** from Landing | N/A |

## Verify after deploy

```bash
curl -sS https://flowboard-iota-blond.vercel.app/health
curl -sS -o /dev/null -w "%{http_code}\n" https://flowboard-iota-blond.vercel.app/
curl -sS -X POST https://flowboard-iota-blond.vercel.app/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","name":"Demo","password":"password123"}'
```

Claim **C15** stamped Grade A in `docs/METRICS.md` from `docs/evidence/vercel-prod-smoke.txt`.

## Project IDs (this session)

- Vercel project: `flowboard` · `prj_XMzk6sV318n2GyIB0lloSZDDj0AD`
- Account/team id seen at create: `team_hcg1M2YFvH8HIomGC87hGd0S`
- Neon: `flowboard-db` (Marketplace)
- Anonymous temp deploy (expired, pre-config): `docs/evidence/vercel-frontend-temp.txt` — not production evidence
