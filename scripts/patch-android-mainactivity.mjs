#!/usr/bin/env node
/**
 * Patches the generated Android MainActivity.java so native Google Sign-In
 * via @capgo/capacitor-social-login works. This must be re-run after every
 * `npx cap sync android` because Capacitor regenerates MainActivity.java.
 *
 * Usage:
 *   node scripts/patch-android-mainactivity.mjs
 *
 * The script must be run from the project root after the android platform has
 * been added (`npx cap add android`).
 */
import fs from 'node:fs';
import path from 'node:path';

const mainActivityPath =
  process.env.ANDROID_MAIN_ACTIVITY_PATH ||
  path.resolve('android/app/src/main/java/com/visafaster/app/MainActivity.java');

if (!fs.existsSync(mainActivityPath)) {
  console.error(
    `Android MainActivity not found at ${mainActivityPath}.\n` +
      'Run `npx cap add android` (then `npx cap sync android`) first.'
  );
  process.exit(1);
}

let code = fs.readFileSync(mainActivityPath, 'utf8');
let modified = false;

const ensureImport = (importLine) => {
  if (!code.includes(importLine)) {
    // Insert after the package statement, before any other imports.
    code = code.replace(/^(package .*;\n)/m, `$1${importLine}\n`);
    modified = true;
  }
};

const requiredImports = [
  'import android.content.Intent;',
  'import android.util.Log;',
  'import com.getcapacitor.BridgeActivity;',
  'import com.getcapacitor.Plugin;',
  'import com.getcapacitor.PluginHandle;',
  'import ee.forgr.capacitor.social.login.GoogleProvider;',
  'import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;',
  'import ee.forgr.capacitor.social.login.SocialLoginPlugin;',
];

for (const importLine of requiredImports) {
  ensureImport(importLine);
}

// Ensure class implements the required plugin interface.
if (!code.includes('implements ModifiedMainActivityForSocialLoginPlugin')) {
  code = code.replace(
    /extends BridgeActivity\s*(\{|\s*\{)/,
    'extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {'
  );
  modified = true;
}

// Marker interface empty implementation.
if (!code.includes('IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin')) {
  const markerMethod = `
    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
        // Required by ModifiedMainActivityForSocialLoginPlugin.
    }
`;
  // Insert before the final closing brace.
  const lastBrace = code.lastIndexOf('}');
  if (lastBrace !== -1) {
    code = code.slice(0, lastBrace) + markerMethod + code.slice(lastBrace);
    modified = true;
  }
}

// Google Sign-In activity-result handler.
if (!code.includes('handleGoogleLoginIntent')) {
  const activityResultMethod = `
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin login handle is null");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }
`;
  const lastBrace = code.lastIndexOf('}');
  if (lastBrace !== -1) {
    code = code.slice(0, lastBrace) + activityResultMethod + code.slice(lastBrace);
    modified = true;
  }
}

fs.writeFileSync(mainActivityPath, code, 'utf8');

if (modified) {
  console.log(`✅ Patched ${mainActivityPath}`);
} else {
  console.log(`⏭️  No changes needed in ${mainActivityPath}`);
}
