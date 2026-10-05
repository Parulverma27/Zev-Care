#!/usr/bin/env bash
# Register + start the Zevota Care GitHub Actions runner on MilesWeb SM-L1.
# Usage (on VPS as root):
#   TOKEN=XXXX bash scripts/register-runner.sh
# Get TOKEN from:
#   GitHub → NeighShop-Global/Zevota-Care → Settings → Actions → Runners → New self-hosted runner → Linux x64
set -euo pipefail

TOKEN="${TOKEN:-${1:-}}"
if [[ -z "$TOKEN" ]]; then
  echo "ERROR: pass a registration token"
  echo "  TOKEN=xxxxx $0"
  echo "Create one at: https://github.com/NeighShop-Global/Zevota-Care/settings/actions/runners/new"
  exit 1
fi

ROOT=/opt/actions-runner-zevota
RUNNER_USER=github-runner
RUNNER_VERSION=2.336.0
REPO_URL=https://github.com/NeighShop-Global/Zevota-Care

id "$RUNNER_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$RUNNER_USER"
mkdir -p "$ROOT"
cd "$ROOT"

if [[ ! -f ./config.sh ]]; then
  curl -fsSL -o runner.tgz \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  tar xzf runner.tgz && rm -f runner.tgz
  chown -R "$RUNNER_USER:$RUNNER_USER" "$ROOT"
fi

if [[ -f .runner ]]; then
  sudo -u "$RUNNER_USER" ./svc.sh stop 2>/dev/null || true
  sudo -u "$RUNNER_USER" ./config.sh remove --token "$TOKEN" 2>/dev/null || true
fi

sudo -u "$RUNNER_USER" ./config.sh --unattended \
  --url "$REPO_URL" \
  --token "$TOKEN" \
  --name milesweb-zevota \
  --labels self-hosted,Linux,zevota,milesweb \
  --work _work \
  --replace

./svc.sh install "$RUNNER_USER"
./svc.sh start
./svc.sh status
echo "Runner online. Push to main or: gh workflow run \"Deploy Zevota Care\" --repo NeighShop-Global/Zevota-Care"
