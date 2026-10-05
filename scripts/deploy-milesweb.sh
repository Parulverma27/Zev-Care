#!/usr/bin/env bash
# Zevota Care — post-build deploy on MilesWeb SM-L1 (self-hosted runner).
# Usage: sudo bash scripts/deploy-milesweb.sh [SOURCE_DIR]
set -euo pipefail

SOURCE_DIR="${1:-$PWD}"
APP_DIR="${APP_DIR:-/opt/zevota-api}"
WEB_ROOT="${WEB_ROOT:-/var/www/zevota}"
SERVICE="${SYSTEMD_SERVICE:-zevota-api}"
API_PORT="${API_PORT:-8215}"
EXPECTED_IP="${EXPECTED_IP:-45.195.159.63}"

log() { echo "→ $*"; }

assert_vps() {
  local ip
  ip=$(curl -fsS --max-time 10 https://api.ipify.org 2>/dev/null || curl -fsS --max-time 10 ifconfig.me)
  if [[ "$ip" != "$EXPECTED_IP" ]]; then
    echo "ERROR: expected public IP $EXPECTED_IP, got ${ip:-unknown}" >&2
    exit 1
  fi
}

assert_vps

if [[ ! -f "$SOURCE_DIR/public/index.html" ]]; then
  echo "ERROR: $SOURCE_DIR/public/index.html missing — run npm run build:web first" >&2
  exit 1
fi

log "Sync app code to $APP_DIR"
mkdir -p "$APP_DIR" "$WEB_ROOT"/{admin,user,provider} /var/log/zevota-api
rsync -a --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude android \
  --exclude ios \
  --exclude images \
  --exclude 'resources/views/android' \
  --exclude 'resources/views/ios' \
  --exclude 'resources/views/node_modules' \
  --exclude 'resources/views/build-output' \
  --exclude 'resources/views/signing' \
  --exclude .env \
  --exclude 'resources/views/.env' \
  "$SOURCE_DIR/" "$APP_DIR/"

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "ERROR: $APP_DIR/.env missing — create it once on the server (see docs/ci-cd.md)" >&2
  exit 1
fi

log "Install production dependencies"
cd "$APP_DIR"
npm install --omit=dev --no-audit --no-fund
npm approve-scripts --allow-scripts sqlite3 2>/dev/null || true

log "Database migrations"
node database/runMigrations.js

log "Sync static panels"
rsync -a --delete "$APP_DIR/public/" "$WEB_ROOT/admin/"
rsync -a --delete "$APP_DIR/public/" "$WEB_ROOT/user/"
rsync -a --delete "$APP_DIR/public/" "$WEB_ROOT/provider/"

chown -R www-data:www-data "$APP_DIR" "$WEB_ROOT" /var/log/zevota-api
chmod 600 "$APP_DIR/.env"

log "Restart API"
systemctl daemon-reload
systemctl enable "$SERVICE"
systemctl restart "$SERVICE"

log "Health check"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${API_PORT}/api/health" >/dev/null 2>&1; then
    curl -fsS "http://127.0.0.1:${API_PORT}/api/health"
    echo ""
    nginx -t && nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null || true
    echo "✓ Zevota Care deployed"
    exit 0
  fi
  sleep 2
done

echo "ERROR: API health check failed" >&2
journalctl -u "$SERVICE" -n 40 --no-pager || true
exit 1
