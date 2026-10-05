#!/usr/bin/env bash
set -euo pipefail

VIEWS_DIR="$(cd "$(dirname "$0")/../../resources/views" && pwd)"
SIGNING_DIR="$VIEWS_DIR/signing"
KEYSTORE="$SIGNING_DIR/upload-keystore.jks"

mkdir -p "$SIGNING_DIR"

ALIAS="${ANDROID_KEY_ALIAS:-upload}"
STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-$STORE_PASS}"
DNAME="${ANDROID_KEY_DNAME:-CN=Node Express RN, OU=Mobile, O=Template, L=City, ST=State, C=IN}"

if [[ -z "$STORE_PASS" ]]; then
  echo "Set ANDROID_KEYSTORE_PASSWORD (and optionally ANDROID_KEY_PASSWORD) in .env"
  exit 1
fi

if [[ -f "$KEYSTORE" ]]; then
  echo "Keystore already exists: $KEYSTORE"
  echo "Delete it first if you want to regenerate."
  exit 1
fi

keytool -genkeypair -v \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -alias "$ALIAS" \
  -keystore "$KEYSTORE" \
  -dname "$DNAME"

echo "✓ Created $KEYSTORE"
echo "Next: npm run android:key-props && npm run android:sha"
