#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=env.sh
source "$SCRIPT_DIR/env.sh"
require_java
require_android_sdk
VIEWS_DIR="$(cd "$SCRIPT_DIR/../../resources/views" && pwd)"
cd "$VIEWS_DIR"

if [[ ! -d android ]]; then
  echo "Running expo prebuild for Android..."
  npx expo prebuild --platform android --no-install
fi

if [[ ! -f android/key.properties ]]; then
  bash "$SCRIPT_DIR/android-setup-key-properties.sh"
fi

bash "$SCRIPT_DIR/android-apply-signing.sh"

cd android
chmod +x gradlew
./gradlew assembleRelease

APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [[ -f "$APK_PATH" ]]; then
  mkdir -p "$VIEWS_DIR/build-output"
  cp "$APK_PATH" "$VIEWS_DIR/build-output/app-release.apk"
  DESKTOP_APK="$HOME/Desktop/ZevotaCare.apk"
  cp "$APK_PATH" "$DESKTOP_APK"
  echo "✓ APK: $VIEWS_DIR/build-output/app-release.apk"
  echo "✓ APK: $DESKTOP_APK"
  if command -v shasum >/dev/null 2>&1; then
    echo "SHA256: $(shasum -a 256 "$DESKTOP_APK" | awk '{print $1}')"
  fi
  ls -lh "$DESKTOP_APK"
else
  echo "APK build finished; check app/build/outputs/apk/release/"
fi
