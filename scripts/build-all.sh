#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Build check ==="
npm run mobile:check

echo ""
echo "=== Web build ==="
npm run build:web

echo ""
echo "=== Android APK ==="
npm run build:android:apk

echo ""
echo "=== Android AAB ==="
npm run build:android:aab

echo ""
echo "=== Outputs ==="
echo "Web:  $ROOT/public/"
echo "APK:  $ROOT/resources/views/build-output/app-release.apk"
echo "AAB:  $ROOT/resources/views/build-output/app-release.aab"
ls -lh "$ROOT/resources/views/build-output/" 2>/dev/null || true
