# Deploy — FlowBoard on Vercel

**Demo environment** (this doc) ≠ **proof environment** (`pytest` + Compose).  
Do not cite Vercel uptime/latency as backend benchmarks.

## Architecture (DECIDED)

One Vercel project (`flowboard`) using **Vercel Services**:

| Service | Root | Runtime | Public routes |
|---------|------|---------|---------------|
| `frontend` | `frontend/` | Vite static | `/*` (SPA fallback) |
| `backend` | `backend/` | FastAPI | `/api/*`, `/ws/*`, `/health`, `/docs` |

Same-origin relative `/api/v1` + `/ws` from the SPA — no separate API hostname required for previews.

## Prerequisites (you must complete)

1. **Claim / own the Vercel project** under your account (`dhruva-ahers-projects` / team that owns `prj_XMzk6sV318n2GyIB0lloSZDDj0AD`).
2. **Install the Vercel GitHub App** on `Dhruva-Aher/FlowBoard`: https://github.com/apps/vercel  
   Then link the repo in Project Settings → Git.
3. **Neon Postgres** (Marketplace → Neon → create DB → connect to `flowboard`).  
   Env injected is usually `DATABASE_URL` (and sometimes `DATABASE_URL_UNPOOLED`).
4. **(Optional) Upstash Redis** for realtime pub/sub/presence. Without it the API uses **NullRedis** (CRUD works; cross-client live sync is off).
5. Set secrets (Production + Preview):

| Key | Notes |
|-----|--------|
| `SECRET_KEY` | `openssl rand -hex 32` |
| `REFRESH_SECRET_KEY` | `openssl rand -hex 32` |
| `ENVIRONMENT` | `production` |
| `FRONTEND_URL` | `https://<your-prod-domain>` |
| `CORS_ORIGINS` | optional extras; `*.vercel.app` already allowed by regex |
| `RUN_MIGRATIONS_ON_STARTUP` | `true` on first deploys |
| `DATABASE_URL` | from Neon (asyncpg normalized in code) |
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
curl -sS https://<host>/health
curl -sS -o /dev/null -w "%{http_code}\n" https://<host>/
curl -sS -X POST https://<host>/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","name":"Demo","password":"password123"}'
```

Record the production URL in `docs/METRICS.md` claim **C15** only after these succeed (Grade A).

## Project IDs (this session)

- Vercel project: `flowboard` · `prj_XMzk6sV318n2GyIB0lloSZDDj0AD`
- Account/team id seen at create: `team_hcg1M2YFvH8HIomGC87hGd0S`
- Anonymous temp deploy (expired/claimable, pre-config): see chat transcript — not production evidence
