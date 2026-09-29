#!/usr/bin/env bash
# One-shot: after `vercel login`, provision Neon + secrets and deploy FlowBoard.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Whoami"
npx vercel@latest whoami

echo "==> Link project flowboard"
npx vercel@latest link --yes --project flowboard || npx vercel@latest link --yes

echo "==> Generate secrets"
SECRET_KEY="$(openssl rand -hex 32)"
REFRESH_SECRET_KEY="$(openssl rand -hex 32)"

echo "==> Set core env (production + preview)"
for TARGET in production preview; do
  printf '%s' "$SECRET_KEY" | npx vercel@latest env add SECRET_KEY "$TARGET" --force >/dev/null
  printf '%s' "$REFRESH_SECRET_KEY" | npx vercel@latest env add REFRESH_SECRET_KEY "$TARGET" --force >/dev/null
  printf '%s' "production" | npx vercel@latest env add ENVIRONMENT "$TARGET" --force >/dev/null
  printf '%s' "true" | npx vercel@latest env add RUN_MIGRATIONS_ON_STARTUP "$TARGET" --force >/dev/null
done

echo "==> Install Neon (Marketplace) — may open browser / ask confirm"
# Prefer non-interactive flags when available
if npx vercel@latest integration add --help 2>&1 | grep -q -- '--yes'; then
  npx vercel@latest integration add neon --yes --no-claim || \
    npx vercel@latest integration add neon
else
  npx vercel@latest integration add neon
fi

echo "==> Optional Upstash Redis (skip if you decline)"
npx vercel@latest integration add upstash --yes --no-claim 2>/dev/null || \
  echo "(Upstash skipped — NullRedis demo mode is fine)"

echo "==> Pull env to confirm DATABASE_URL"
npx vercel@latest env pull .env.vercel --yes
grep -E '^(DATABASE_URL|REDIS_URL|SECRET_KEY)=' .env.vercel | sed 's/=.*/=***/' || true

# FRONTEND_URL set after first prod deploy alias is known
echo "==> Production deploy"
URL="$(npx vercel@latest deploy --prod --yes 2>&1 | tee /tmp/vercel-prod-deploy.txt | tail -20)"
PROD_HOST="$(rg -o 'https://[a-zA-Z0-9.-]+\.vercel\.app' /tmp/vercel-prod-deploy.txt | tail -1 || true)"
if [[ -n "${PROD_HOST:-}" ]]; then
  printf '%s' "$PROD_HOST" | npx vercel@latest env add FRONTEND_URL production --force >/dev/null || true
  echo "FRONTEND_URL=$PROD_HOST"
  echo "==> Redeploy so FRONTEND_URL sticks"
  npx vercel@latest deploy --prod --yes
fi

echo "==> Health check"
curl -fsS "${PROD_HOST:-https://flowboard.vercel.app}/health" || true
echo
echo "Done. Record the URL in docs/METRICS.md claim C15."
