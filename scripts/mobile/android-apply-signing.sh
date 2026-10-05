#!/usr/bin/env bash
set -euo pipefail

VIEWS_DIR="$(cd "$(dirname "$0")/../../resources/views" && pwd)"
GRADLE="$VIEWS_DIR/android/app/build.gradle"

if [[ ! -f "$GRADLE" ]]; then
  echo "android/app/build.gradle not found"
  exit 1
fi

if grep -q "keystoreProperties\['keyAlias'\]" "$GRADLE"; then
  echo "✓ Signing already configured in build.gradle"
  exit 0
fi

python3 <<PY
from pathlib import Path

gradle = Path("$GRADLE")
text = gradle.read_text()

loader = """
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
"""

release_signing = """
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
"""

if "def keystoreProperties" not in text:
    text = loader + "\n" + text

if "keystoreProperties['keyAlias']" not in text:
    text = text.replace(
        "signingConfigs {",
        "signingConfigs {" + release_signing,
        1,
    )

if "signingConfig signingConfigs.release" not in text:
    import re
    text = re.sub(
        r"(buildTypes\s*\{[^}]*release\s*\{)",
        r"\1\n            signingConfig signingConfigs.release",
        text,
        count=1,
    )

gradle.write_text(text)
print("✓ Applied release signing to build.gradle")
PY
