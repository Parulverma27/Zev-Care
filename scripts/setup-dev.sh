#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Node Express RN — dev setup ==="

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
  echo "IMPORTANT: Edit .env and set DB_PASSWORD and ANDROID_KEYSTORE_PASSWORD"
else
  echo ".env already exists (not overwritten)"
fi

npm install

if ! command -v java >/dev/null 2>&1; then
  if [[ -x /opt/homebrew/opt/openjdk@17/bin/java ]]; then
    echo "Java found via Homebrew (build scripts auto-detect it)"
  else
    echo "Installing Java..."
    brew install openjdk@17
  fi
else
  echo "Java: $(java -version 2>&1 | head -1)"
fi

if [[ ! -d /opt/homebrew/share/android-commandlinetools ]] && [[ ! -d "$HOME/Library/Android/sdk" ]]; then
  echo "Installing Android command-line tools..."
  brew install --cask android-commandlinetools
else
  echo "Android SDK tools already present"
fi

echo ""
echo "=== Next steps ==="
echo "1. Edit .env — set DB_PASSWORD (required)"
echo "2. Edit .env — set ANDROID_KEYSTORE_PASSWORD (for APK/AAB)"
echo "3. npm run migrate"
echo "4. npm run mobile:check"
echo "5. npm run build:android:apk"
