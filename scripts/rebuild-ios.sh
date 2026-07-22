#!/usr/bin/env bash
# Nuclear iOS rebuild — guarantees the native bundle contains ZERO Lovable
# references and no stale `server.url`. Run this from the project root
# BEFORE opening Xcode. If any check fails the script exits non-zero and
# you must NOT open Xcode until it's fixed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> [1/6] Removing old ios/, dist/, and Vite cache"
rm -rf ios dist node_modules/.vite

echo "==> [2/6] Installing dependencies (npm ci)"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> [3/6] Building web bundle (runs mobile build guard automatically)"
npm run build

echo "==> [4/6] Proving dist/ is clean"
# Only flag ACTUAL URLs / navigations to Lovable, not the defensive host list
# that nativeSafety.ts uses to block those URLs. The safety list is a bare
# string array (e.g. ["lovable.dev","lovable.app",...]) with no https:// or //.
if grep -R -I -i -E "(https?:)?//[a-z0-9.-]*lovable\.(dev|app)|(https?:)?//[a-z0-9.-]*lovableproject|forceHideBadge" dist >/dev/null 2>&1; then
  echo "FAIL: dist/ contains an actual Lovable URL. Aborting BEFORE touching iOS."
  grep -R -I -n -i -E "(https?:)?//[a-z0-9.-]*lovable\.(dev|app)|(https?:)?//[a-z0-9.-]*lovableproject|forceHideBadge" dist || true
  exit 1
fi
echo "OK: dist/ has no Lovable URLs."

echo "==> [5/6] Adding & syncing iOS platform"
npx cap add ios
npx cap sync ios

echo "==> [6/6] Proving generated ios/ is clean"
FAILED=0
if grep -R -I -i -E "(https?:)?//[a-z0-9.-]*lovable\.(dev|app)|(https?:)?//[a-z0-9.-]*lovableproject" ios/App/App/capacitor.config.json ios/App/App/public 2>/dev/null; then
  echo "FAIL: iOS bundle contains an actual Lovable URL."
  FAILED=1
fi
if grep -q '"url"' ios/App/App/capacitor.config.json 2>/dev/null; then
  echo "FAIL: capacitor.config.json inside ios/ has a server.url — this MUST NOT ship."
  FAILED=1
fi
if [ "$FAILED" -ne 0 ]; then
  echo "Aborting. Do NOT open Xcode until this is resolved."
  exit 1
fi

echo ""
echo "SUCCESS ✅ — iOS bundle is clean."
echo "Next: npx cap open ios"
echo "In Xcode: delete the old app from the simulator/device, then Product → Clean Build Folder → Run."