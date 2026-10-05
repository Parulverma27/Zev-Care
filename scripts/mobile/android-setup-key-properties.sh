#!/usr/bin/env bash
set -euo pipefail

VIEWS_DIR="$(cd "$(dirname "$0")/../../resources/views" && pwd)"
SIGNING_DIR="$VIEWS_DIR/signing"
ANDROID_DIR="$VIEWS_DIR/android"
OUT_FILE="$ANDROID_DIR/key.properties"

ALIAS="${ANDROID_KEY_ALIAS:-upload}"
STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-$STORE_PASS}"

if [[ -z "$STORE_PASS" ]]; then
  echo "Set ANDROID_KEYSTORE_PASSWORD in .env"
  exit 1
fi

if [[ ! -f "$SIGNING_DIR/upload-keystore.jks" ]]; then
  echo "Keystore missing. Run: npm run android:keystore"
  exit 1
fi

mkdir -p "$ANDROID_DIR"

cat > "$OUT_FILE" <<EOF
storePassword=${STORE_PASS}
keyPassword=${KEY_PASS}
keyAlias=${ALIAS}
storeFile=../../signing/upload-keystore.jks
EOF

echo "✓ Wrote $OUT_FILE"
