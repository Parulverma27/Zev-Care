#!/usr/bin/env bash
set -euo pipefail

VIEWS_DIR="$(cd "$(dirname "$0")/../../resources/views" && pwd)"
SIGNING_DIR="$VIEWS_DIR/signing"
KEYSTORE="$SIGNING_DIR/upload-keystore.jks"
KEY_PROPS="$VIEWS_DIR/android/key.properties"

echo "=== Android debug keystore SHA (for Google/Firebase dev) ==="
DEBUG_KEYSTORE="${HOME}/.android/debug.keystore"
if [[ -f "$DEBUG_KEYSTORE" ]]; then
  keytool -list -v \
    -keystore "$DEBUG_KEYSTORE" \
    -alias androiddebugkey \
    -storepass android \
    -keypass android 2>/dev/null | grep -E "SHA1:|SHA256:" || true
else
  echo "Debug keystore not found at $DEBUG_KEYSTORE"
  echo "Run an Android build once or create it via Android Studio."
fi

echo ""
echo "=== Android release keystore SHA ==="
if [[ -f "$KEYSTORE" ]]; then
  ALIAS="${ANDROID_KEY_ALIAS:-upload}"
  STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-}"
  if [[ -z "$STORE_PASS" && -f "$KEY_PROPS" ]]; then
    ALIAS="$(grep '^keyAlias=' "$KEY_PROPS" | cut -d= -f2)"
    STORE_PASS="$(grep '^storePassword=' "$KEY_PROPS" | cut -d= -f2)"
  fi
  if [[ -n "$STORE_PASS" ]]; then
    keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" -storepass "$STORE_PASS" 2>/dev/null \
      | grep -E "SHA1:|SHA256:" || true
  else
    echo "Set ANDROID_KEYSTORE_PASSWORD or create android/key.properties, then re-run."
    echo "Keystore: $KEYSTORE"
  fi
else
  echo "Release keystore not found. Run: npm run android:keystore"
fi

if [[ -d "$VIEWS_DIR/android" ]]; then
  echo ""
  echo "=== Gradle signingReport (if android/ exists) ==="
  (cd "$VIEWS_DIR/android" && ./gradlew signingReport 2>/dev/null | grep -E "SHA1:|SHA-256:" || true)
fi
