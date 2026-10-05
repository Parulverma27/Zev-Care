# Zevota Care CI/CD — MilesWeb self-hosted runner

**Status:** Register runner once, then every push to `main` auto-deploys.

| Item | Value |
|------|--------|
| Server | MilesWeb `45.195.159.63` |
| Runner path | `/opt/actions-runner-zevota` |
| Runner user | `github-runner` |
| Labels | `self-hosted`, `Linux`, `zevota`, `milesweb` |
| API path | `/opt/zevota-api` |
| Web panels | `/var/www/zevota/{admin,user,provider}` |
| Workflow | `.github/workflows/deploy.yml` |

## One-time: register runner on MilesWeb

1. Open [New self-hosted runner](https://github.com/NeighShop-Global/Zevota-Care/settings/actions/runners/new) → **Linux** → **x64**
2. Copy the registration token
3. On the VPS:

```bash
ssh root@45.195.159.63
TOKEN=<paste-token> bash /opt/zevota-api/scripts/register-runner.sh
```

## Auto deploy

Every push to `main` (or manual **Deploy Zevota Care** workflow):

1. `npm ci` + `npm run build:web` on the runner
2. `scripts/deploy-milesweb.sh` → sync code, migrate, restart API, publish static panels
3. `deploy/smoke.sh` → health + user app checks

## Manual deploy (without CI)

```bash
npm install && npm run build:web
rsync -az --exclude node_modules --exclude .git --exclude .env ./ root@45.195.159.63:/opt/zevota-api/
ssh root@45.195.159.63 'bash /opt/zevota-api/scripts/deploy-milesweb.sh /opt/zevota-api'
```

## App icon

Source: `resources/views/assets/source/app-icon.png`  
Regenerate all sizes: `npm run sync-app-icon`

## Verify

```bash
curl -sS https://api.zevota.neighshopglobal.com/api/health
curl -sSI https://user.zevota.neighshopglobal.com/user/home
```
