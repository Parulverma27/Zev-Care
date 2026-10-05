#!/usr/bin/env bash
set -euo pipefail

VIEWS_DIR="$(cd "$(dirname "$0")/../../resources/views" && pwd)"
cd "$VIEWS_DIR"

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Local IPA archive requires macOS + Xcode."
  echo "On CI/Linux use: npm run eas:ios:ipa"
  exit 1
fi

if [[ ! -d ios ]]; then
  echo "Running expo prebuild for iOS..."
  npx expo prebuild --platform ios --no-install
fi

SCHEME="${IOS_SCHEME:-NodeExpressRN}"
WORKSPACE="ios/${SCHEME}.xcworkspace"
PROJECT="ios/${SCHEME}.xcodeproj"
ARCHIVE_PATH="$VIEWS_DIR/build-output/${SCHEME}.xcarchive"
EXPORT_PATH="$VIEWS_DIR/build-output/ipa"
EXPORT_OPTIONS="$VIEWS_DIR/signing/ExportOptions.plist"

mkdir -p "$VIEWS_DIR/build-output"

if [[ -d "$WORKSPACE" ]]; then
  BUILD_TARGET=(-workspace "$WORKSPACE")
elif [[ -d "$PROJECT" ]]; then
  BUILD_TARGET=(-project "$PROJECT")
else
  WORKSPACE=$(find ios -name "*.xcworkspace" | head -1)
  PROJECT=$(find ios -name "*.xcodeproj" | head -1)
  if [[ -n "$WORKSPACE" ]]; then
    BUILD_TARGET=(-workspace "$WORKSPACE")
    SCHEME=$(basename "$WORKSPACE" .xcworkspace)
  elif [[ -n "$PROJECT" ]]; then
    BUILD_TARGET=(-project "$PROJECT")
    SCHEME=$(basename "$PROJECT" .xcodeproj)
  else
    echo "No Xcode workspace/project found under ios/"
    exit 1
  fi
fi

echo "Archiving scheme: $SCHEME"
xcodebuild "${BUILD_TARGET[@]}" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  archive

if [[ ! -f "$EXPORT_OPTIONS" ]]; then
  cat > "$EXPORT_OPTIONS" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>uploadSymbols</key>
  <true/>
  <key>signingStyle</key>
  <string>automatic</string>
</dict>
</plist>
EOF
  echo "Created default $EXPORT_OPTIONS — customize for your team/provisioning."
fi

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS"

echo "✓ IPA export folder: $EXPORT_PATH"
