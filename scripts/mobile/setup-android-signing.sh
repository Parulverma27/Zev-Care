#!/usr/bin/env bash
# One-time (or idempotent) Android signing setup for APK/AAB builds.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VIEWS_DIR="$ROOT_DIR/resources/views"
KEYSTORE="$VIEWS_DIR/signing/upload-keystore.jks"

# Load Android signing vars from .env (safe for special chars in passwords)
if [[ -f "$ROOT_DIR/.env" ]]; then
  ANDROID_KEYSTORE_PASSWORD="$(grep '^ANDROID_KEYSTORE_PASSWORD=' "$ROOT_DIR/.env" | cut -d= -f2- | tr -d '\r' || true)"
  ANDROID_KEY_PASSWORD="$(grep '^ANDROID_KEY_PASSWORD=' "$ROOT_DIR/.env" | cut -d= -f2- | tr -d '\r' || true)"
  ANDROID_KEY_ALIAS="$(grep '^ANDROID_KEY_ALIAS=' "$ROOT_DIR/.env" | cut -d= -f2- | tr -d '\r' || true)"
  export ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_PASSWORD ANDROID_KEY_ALIAS
fi

if [[ -z "${ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
  echo "⚠ ANDROID_KEYSTORE_PASSWORD not set in .env"
  echo "  Add it once, then re-run. Example:"
  echo "  ANDROID_KEYSTORE_PASSWORD=your_secure_password"
  exit 1
fi

export ANDROID_KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-$ANDROID_KEYSTORE_PASSWORD}"

if [[ ! -f "$KEYSTORE" ]]; then
  echo "→ Generating upload keystore..."
  bash "$SCRIPT_DIR/android-generate-keystore.sh"
else
  echo "✓ Keystore exists: signing/upload-keystore.jks"
fi

if [[ -d "$VIEWS_DIR/android" ]]; then
  bash "$SCRIPT_DIR/android-setup-key-properties.sh"
else
  echo "→ android/ not generated yet — key.properties will be created after prebuild"
fi

echo ""
echo "✓ Android signing ready."
echo "  Keystore: resources/views/signing/upload-keystore.jks"
echo "  Next: npm run build:android:apk  (or build:android:aab)"
