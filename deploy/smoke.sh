#!/usr/bin/env bash
# Smoke tests after Zevota Care deploy on MilesWeb.
set -euo pipefail

API_PORT="${API_PORT:-8215}"
HEALTH_LOCAL="${HEALTH_LOCAL:-http://127.0.0.1:${API_PORT}/api/health}"
HEALTH_PUBLIC="${HEALTH_PUBLIC:-https://api.zevota.neighshopglobal.com/api/health}"
USER_URL="${USER_URL:-https://user.zevota.neighshopglobal.com/user/home}"
CATALOG_URL="${CATALOG_URL:-https://user.zevota.neighshopglobal.com/api/catalog}"

echo "→ Local API health"
curl -fsS "$HEALTH_LOCAL" | grep -q '"status":"ok"'

echo "→ Public API health"
curl -fsS "$HEALTH_PUBLIC" | grep -q '"status":"ok"'

echo "→ User app"
curl -fsSI "$USER_URL" | head -1 | grep -q '200'

echo "→ Catalog API"
curl -fsS "$CATALOG_URL" | grep -q '"version"'

echo "✓ Smoke tests passed"
