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
./gradlew bundleRelease

AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
if [[ -f "$AAB_PATH" ]]; then
  mkdir -p "$VIEWS_DIR/build-output"
  cp "$AAB_PATH" "$VIEWS_DIR/build-output/app-release.aab"
  echo "✓ AAB: $VIEWS_DIR/build-output/app-release.aab"
else
  echo "AAB build finished; check app/build/outputs/bundle/release/"
fi
