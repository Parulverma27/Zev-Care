#!/usr/bin/env bash
# Quick check: can this machine build APK / AAB / IPA / web?
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=env.sh
source "$SCRIPT_DIR/env.sh"
OK=0
WARN=0

pass() { echo "✓ $1"; OK=$((OK + 1)); }
warn() { echo "⚠ $1"; WARN=$((WARN + 1)); }
fail() { echo "✗ $1"; }

echo "=== Build environment check ==="
echo ""

# Node
if command -v node >/dev/null 2>&1; then
  pass "Node $(node -v)"
else
  fail "Node.js not found"
fi

# Java (Android)
if detect_java_home; then
  pass "Java $(java -version 2>&1 | head -1) — JAVA_HOME=$JAVA_HOME"
else
  warn "Java not found — brew install openjdk@17"
fi

# Android SDK
if detect_android_home; then
  pass "ANDROID_HOME=$ANDROID_HOME"
else
  warn "ANDROID_HOME not found — brew install --cask android-commandlinetools"
fi

# Xcode (iOS)
if [[ "$(uname)" == "Darwin" ]] && xcode-select -p >/dev/null 2>&1; then
  pass "Xcode CLI tools"
else
  warn "Xcode not found — needed for local IPA (macOS only)"
fi

# .env
if [[ -f "$ROOT_DIR/.env" ]]; then
  pass ".env exists"
else
  warn "No .env — run: cp .env.example .env"
fi

# Android signing
KEYSTORE="$ROOT_DIR/resources/views/signing/upload-keystore.jks"
if [[ -f "$KEYSTORE" ]]; then
  pass "Android keystore exists"
elif grep -q '^ANDROID_KEYSTORE_PASSWORD=.' "$ROOT_DIR/.env" 2>/dev/null; then
  warn "Keystore missing — run: npm run mobile:setup"
else
  warn "ANDROID_KEYSTORE_PASSWORD not set — add to .env, then: npm run mobile:setup"
fi

# Optional features (informational)
if [[ -f "$ROOT_DIR/.env" ]]; then
  echo ""
  echo "=== Optional features (.env) ==="
  grep -q '^EXPO_PUBLIC_FIREBASE_API_KEY=.' "$ROOT_DIR/.env" 2>/dev/null && pass "Firebase enabled" || echo "  Firebase: off (no keys)"
  grep -q '^EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=.' "$ROOT_DIR/.env" 2>/dev/null && pass "Google Sign-In enabled" || echo "  Google Auth: off (no keys)"
  grep -q '^EXPO_PUBLIC_RAZORPAY_KEY_ID=.' "$ROOT_DIR/.env" 2>/dev/null && pass "Razorpay enabled" || echo "  Razorpay: off (no keys)"
  grep -q '^RAZORPAY_KEY_SECRET=.' "$ROOT_DIR/.env" 2>/dev/null && pass "Razorpay server enabled" || true
fi

echo ""
echo "=== Build outputs (after build) ==="
echo "  Web:     public/"
echo "  APK:     resources/views/build-output/app-release.apk"
echo "  AAB:     resources/views/build-output/app-release.aab"
echo "  IPA:     resources/views/build-output/ipa/"
echo ""
echo "Checks: $OK passed, $WARN warnings"
