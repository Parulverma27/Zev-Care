#!/usr/bin/env bash
# Auto-detect JAVA_HOME and ANDROID_HOME for local APK/AAB builds.
# Sourced by scripts/mobile/*.sh — no need to configure shell profile.

detect_java_home() {
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    return 0
  fi

  local candidates=(
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
    "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  )

  for dir in "${candidates[@]}"; do
    if [[ -x "$dir/bin/java" ]]; then
      export JAVA_HOME="$dir"
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  done

  if /usr/libexec/java_home -v 17 2>/dev/null; then
    export JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null)"
    export PATH="$JAVA_HOME/bin:$PATH"
    return 0
  fi

  return 1
}

detect_android_home() {
  if [[ -n "${ANDROID_HOME:-}" && -d "${ANDROID_HOME}" ]]; then
    export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
    return 0
  fi

  local candidates=(
    "$HOME/Library/Android/sdk"
    "/opt/homebrew/share/android-commandlinetools"
    "/usr/local/share/android-commandlinetools"
  )

  for dir in "${candidates[@]}"; do
    if [[ -d "$dir" ]]; then
      export ANDROID_HOME="$dir"
      export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
      return 0
    fi
  done

  return 1
}

require_java() {
  if ! detect_java_home; then
    echo "✗ Java not found."
    echo "  Install: brew install openjdk@17"
    echo "  Or set JAVA_HOME in your shell before building."
    exit 1
  fi
}

require_android_sdk() {
  detect_android_home || true
  if [[ -z "${ANDROID_HOME:-}" ]]; then
    echo "⚠ ANDROID_HOME not found — Gradle may download SDK components on first build."
    echo "  Install: brew install --cask android-commandlinetools"
  fi
}
