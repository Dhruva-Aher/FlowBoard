# Decisions — FlowBoard

Status legend: **PROPOSED** ≠ **DECIDED** ≠ **IMPLEMENTED** ≠ **VERIFIED**.  
Entries below are from the portfolio-hardening session. No invented benchmarks.

---

## D1 — Treat FlowBoard as full-stack multi-tenant SaaS (not a systems KV / agent project)

- **Context:** Portfolio spans domains; this repo is Kanban + docs + realtime on FastAPI/React.
- **Decision:** Position for Backend / Full-stack interviews; own authz + tenant + ordering + WS gate.
- **Why:** Matches actual code; avoids cloning another project’s docs pack.
- **Alternatives:** Pitch as “realtime infra” only; overclaim AWS production SaaS.
- **Tradeoffs:** Less “infra flex”; more honest product JTBD.
- **Evidence:** Repo layout `backend/app`, `frontend/src`; README outcomes.
- **Status:** DECIDED · IMPLEMENTED (docs)

---

## D2 — Correct claims downward; drop “production-grade” and unverified deploy

- **Context:** README said “production-grade”; CI had AWS ECS/S3/CloudFront deploy without verified runs in-repo.
- **Decision:** Remove production-grade wording; CI runs tests + frontend typecheck + ruff only; no deploy job until evidence exists.
- **Why:** Goal #1/#8 — every public claim verifiable; prefer correcting downward.
- **Alternatives:** Keep deploy job gated on secrets (still implies production).
- **Tradeoffs:** Less impressive CI diagram; higher recruiter trust.
- **Evidence:** `.github/workflows/ci.yml` rewrite; `docs/METRICS.md` non-claims.
- **Status:** DECIDED · IMPLEMENTED

---

## D3 — Fail-closed WebSocket membership (JWT alone insufficient)

- **Context:** Handler validated JWT then accepted any `workspace_id` — cross-tenant event risk.
- **Decision:** After JWT + `type==access`, query `workspace_members`; non-member → close **4003** before accept.
- **Why:** Multi-tenant differentiator; matches REST fail-closed posture.
- **Alternatives:** Presence-only auth; trust client-supplied workspace id.
- **Tradeoffs:** Extra DB round-trip on connect; correct security default.
- **Evidence:** `backend/app/websocket/handler.py`; `tests/integration/test_websocket_authz.py`.
- **Status:** DECIDED · IMPLEMENTED · VERIFIED (membership helper tests)

---

## D4 — Fix Kanban `position` assignment falsy-zero bug

- **Context:** `max_pos = result.scalar() or -1` treated `0` as empty → every new task got `position=0`.
- **Decision:** Use `is None` check; keep regression test `test_task_position_auto_assigned`.
- **Why:** Ordering is a domain correctness claim peers often fake.
- **Alternatives:** Fractional indexing / lexorank (larger change).
- **Tradeoffs:** Integer reindex on move remains O(n) siblings — acceptable at current scale.
- **Evidence:** `task_service.py`; test asserts positions 0 then 1.
- **Status:** DECIDED · IMPLEMENTED · VERIFIED

---

## D5 — Repair pytest harness (loop isolation, no `app` name shadow)

- **Context:** Session-scoped engine + shared session caused asyncpg “different loop” / “operation in progress”; `import app.models` rebound FastAPI `app` to the package.
- **Decision:** Function-scoped NullPool engine; per-request session in override; `importlib.import_module("app.models")`; rename import to `fastapi_app`.
- **Why:** Cannot claim test counts without a green suite.
- **Alternatives:** SQLite for tests (diverges from Postgres JSON/UUID behavior).
- **Tradeoffs:** Slightly slower tests (create/truncate per test).
- **Evidence:** `tests/conftest.py`; **59 passed** in `docs/evidence/`.
- **Status:** DECIDED · IMPLEMENTED · VERIFIED

---

## D6 — Separate demo (Compose UI) from proof (pytest)

- **Context:** No live URL; temptation to imply production metrics from local demo.
- **Decision:** README states demo = localhost; metrics only from pytest evidence files.
- **Why:** Goal #7.
- **Alternatives:** Host a free-tier demo and mix numbers.
- **Tradeoffs:** No flashy URL on resume yet.
- **Evidence:** README “Live deploy: none”; `docs/METRICS.md`.
- **Status:** DECIDED · IMPLEMENTED

---

## D7 — Celery/SES/S3 remain non-claims until integration evidence

- **Context:** Worker tasks call boto3 SES/S3; no recorded successful send/upload in evidence.
- **Decision:** Document as implemented stubs needing AWS; Grade **D** for “notifications work.”
- **Why:** Honesty over resume inflation.
- **Alternatives:** Mock SES in tests and claim “email pipeline tested” (still not end-to-end).
- **Tradeoffs:** Smaller feature list on README.
- **Evidence:** `email_tasks.py`, `export_tasks.py`; METRICS non-claims.
- **Status:** DECIDED · DOCUMENTED (code unchanged)

---

## D8 — Frontend CI = typecheck only (no fake test job)

- **Context:** `npm run test` existed; **zero** frontend test files → CI would be empty or misleading.
- **Decision:** CI job `typecheck-frontend` only; backend pytest remains the proof suite.
- **Why:** Don’t claim frontend coverage that doesn’t exist.
- **Alternatives:** Add token RTL smoke tests (future).
- **Tradeoffs:** Less frontend proof today.
- **Evidence:** Glob for `*.test.ts(x)` empty; ci.yml.
- **Status:** DECIDED · IMPLEMENTED

---

## D9 — Docs pack for this domain only

- **Context:** Instructions allow skipping irrelevant packs.
- **Decision:** Ship `DECISIONS.md`, `METRICS.md`, `POSITIONING.md`, `INTERVIEW_GUIDE.md`, `resume/XYZ_SCAFFOLDS.md` — no agent EVAL.md / systems BENCHMARKS.md.
- **Why:** Fit full-stack SaaS; avoid cargo-cult.
- **Status:** DECIDED · IMPLEMENTED

---

## D10 — Commit policy for hardening vs deploy chats

- **Context:** Hardening chat forbade commit/push; deploy chat requires a public Vercel URL and Git link.
- **Decision:** Hardening artifacts may stay uncommitted until asked; **deploy work is committed/pushed** so Vercel/GitHub can build.
- **Status:** DECIDED · supersedes prior “never commit” for this follow-up

---

## D11 — Fix workspace isolation test login content-type

- **Context:** `test_non_member_cannot_access_workspace` logged in with JSON body; login expects OAuth2 form (`username`).
- **Decision:** Use form `data={"username": ...}` like other tests.
- **Why:** Test must prove the 403 claim.
- **Evidence:** `tests/integration/test_workspaces.py`.
- **Status:** DECIDED · IMPLEMENTED · VERIFIED (suite green)

---

## D12 — Public demo on Vercel Services (frontend-primary)

- **Context:** User needs a public deploy; portfolio emphasis is frontend skills, but the app needs the FastAPI backend for a real demo.
- **Decision:** One Vercel project with **Services**: Vite `frontend` + FastAPI `backend`; same-origin `/api` and `/ws` rewrites.
- **Why:** Matches Vercel guidance for polyglot apps; previews stay skew-aligned; no separate API hostname for recruiters.
- **Alternatives:** Frontend-only static site (API dead); separate Railway API (more moving parts); container-only backend.
- **Tradeoffs:** WebSockets/Celery are weak on serverless; must document demo ≠ proof.
- **Evidence:** `vercel.json`, `docs/DEPLOY.md`.
- **Status:** DECIDED · IMPLEMENTED (config) · deploy VERIFIED pending Neon + Git link

---

## D13 — Neon Postgres required; Redis optional (NullRedis)

- **Context:** FastAPI needs Postgres; Marketplace Neon is the preferred Vercel storage. Redis pub/sub is valuable but blockable.
- **Decision:** Require Neon `DATABASE_URL`. If `REDIS_URL` empty → NullRedis so CRUD demo still works; realtime is Grade D on that demo.
- **Why:** Unblocks public frontend demo without lying about live multi-client sync.
- **Alternatives:** Block deploy until Upstash; rewrite to Edge Config (wrong tool).
- **Tradeoffs:** Demo without Redis is not a realtime proof.
- **Evidence:** `app/redis.py`, `app/config.py`, `docs/METRICS.md` non-claims.
- **Status:** DECIDED · IMPLEMENTED

---

## D14 — Schema ensure on cold start when flagged

- **Context:** No separate migrate job on first Vercel deploy.
- **Decision:** `RUN_MIGRATIONS_ON_STARTUP=true` runs async `Base.metadata.create_all` in lifespan (not nested `asyncio.run` Alembic).
- **Why:** Avoid event-loop deadlock; good enough for empty Neon schema.
- **Alternatives:** Manual `alembic upgrade` in CI; Neon init scripts.
- **Tradeoffs:** `create_all` ≠ full Alembic history for complex future migrations.
- **Evidence:** `app/main.py` lifespan.
- **Status:** DECIDED · IMPLEMENTED

---

## D15 — Remove fake Landing marketing metrics

- **Context:** Landing showed “12,000+ teams”, “500K+ tasks”, “99.9% SLA”, fake customer logos — unverifiable.
- **Decision:** Delete those UI claims; reword CTA to portfolio-demo language.
- **Why:** Goal #1/#8 honesty; frontend polish must not invent traction.
- **Evidence:** `frontend/src/pages/Landing.tsx`.
- **Status:** DECIDED · IMPLEMENTED

---

## D17 — Anonymous temp deploy = frontend static only

- **Context:** Full Services deploy needs authenticated Vercel (Python `uv` / container OIDC). CLI logged out; MCP Git link 403 without GitHub App.
- **Decision:** Ship a **claimable temporary static Vite** URL for immediate frontend review; keep root `vercel.json` Services for the permanent full-stack demo after Neon + login.
- **Why:** User’s stated focus is frontend skills; unblock a public URL without inventing a working API.
- **Tradeoffs:** Temp URL expires (~60m) until claimed; `/api` dead until Neon-backed Services deploy.
- **Evidence:** `docs/evidence/vercel-frontend-temp.txt`
- **Status:** DECIDED · IMPLEMENTED · VERIFIED (HTTP 200 Landing shows FlowBoard; no fake stats)

---

## D18 — Cannot finish Neon/Marketplace without owner Vercel login

- **Context:** User asked to “do all setup / connect plugins.” MCP can create the empty `flowboard` project but returns **403** on team scope `dhruva-ahers-projects` for env, integrations, and connectors. CLI is logged out; Marketplace `integration add neon` requires an authenticated human device login.
- **Decision:** Prepare `scripts/vercel-setup-and-deploy.sh` (link → secrets → Neon → optional Upstash → `--prod`). Block on one owner action: complete `vercel login` device URL. Then re-run the script.
- **Why:** No API path exists from this agent token to bill/provision Neon on the user’s team.
- **Status:** DECIDED · script IMPLEMENTED · Neon VERIFIED pending login

---

## D19 — Strip Neon `channel_binding` for asyncpg

- **Context:** Prod `/health` failed: `TypeError: connect() got an unexpected keyword argument 'channel_binding'` (Neon URL + SQLAlchemy 2.0.30 / asyncpg 0.29).
- **Decision:** Normalize `DATABASE_URL` by dropping `channel_binding` and mapping `sslmode` → `ssl=require`.
- **Evidence:** Vercel runtime logs on `flowboard-iota-blond.vercel.app`.
- **Status:** DECIDED · IMPLEMENTED · VERIFIED pending redeploy
