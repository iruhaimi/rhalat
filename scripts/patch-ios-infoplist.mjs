#!/usr/bin/env node
/**
 * Idempotently patches native iOS config after `npx cap add ios`.
 * Injects:
 *   - Camera / Photo Library / Microphone usage descriptions (Arabic)
 *   - Google Sign-In CFBundleURLTypes entry (reversed iOS client ID)
 *   - Sign in with Apple capability + entitlements
 *
 * Safe to re-run: skips any key/scheme that already exists.
 * Run automatically by scripts/rebuild-ios.sh; can also be run manually:
 *   node scripts/patch-ios-infoplist.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PLIST = 'ios/App/App/Info.plist';
const ENTITLEMENTS = 'ios/App/App/App.entitlements';
const PBXPROJ = 'ios/App/App.xcodeproj/project.pbxproj';
const GOOGLE_REVERSED_CLIENT_ID =
  'com.googleusercontent.apps.96772078009-k6qa0s0hg6r62dmgg5vptjmuik28vkp6';

const PERMISSIONS = {
  NSCameraUsageDescription:
    'يستخدم التطبيق الكاميرا لالتقاط صورة الملف الشخصي وصور المستندات المطلوبة لطلب التأشيرة.',
  NSPhotoLibraryUsageDescription:
    'يحتاج التطبيق إلى الوصول إلى مكتبة الصور لاختيار صورة الملف الشخصي وصور المستندات المطلوبة لطلب التأشيرة.',
  NSPhotoLibraryAddUsageDescription:
    'يستخدم التطبيق مكتبة الصور لحفظ إيصالات ووثائق التأشيرة التي تختار تنزيلها.',
  NSMicrophoneUsageDescription:
    'قد يطلب التطبيق الوصول إلى الميكروفون عند تسجيل مقاطع فيديو للمستندات.',
};

if (!existsSync(PLIST)) {
  console.error(`FAIL: ${PLIST} not found. Run \`npx cap add ios\` first.`);
  process.exit(1);
}

if (!existsSync(PBXPROJ)) {
  console.error(`FAIL: ${PBXPROJ} not found. Run \`npx cap add ios\` first.`);
  process.exit(1);
}

let plist = readFileSync(PLIST, 'utf8');
let changed = false;

// 1) Inject any missing permission keys just before the closing </dict></plist>.
for (const [key, value] of Object.entries(PERMISSIONS)) {
  if (plist.includes(`<key>${key}</key>`)) continue;
  const block = `\t<key>${key}</key>\n\t<string>${value}</string>\n`;
  plist = plist.replace(/\n<\/dict>\n<\/plist>\s*$/, `\n${block}</dict>\n</plist>\n`);
  console.log(`  + added ${key}`);
  changed = true;
}

// 2) Inject Google Sign-In CFBundleURLTypes if reversed client ID isn't present.
if (!plist.includes(GOOGLE_REVERSED_CLIENT_ID)) {
  const urlTypesBlock = `\t<key>CFBundleURLTypes</key>
\t<array>
\t\t<dict>
\t\t\t<key>CFBundleTypeRole</key>
\t\t\t<string>Editor</string>
\t\t\t<key>CFBundleURLName</key>
\t\t\t<string>GoogleSignIn</string>
\t\t\t<key>CFBundleURLSchemes</key>
\t\t\t<array>
\t\t\t\t<string>${GOOGLE_REVERSED_CLIENT_ID}</string>
\t\t\t</array>
\t\t</dict>
\t</array>
`;
  if (plist.includes('<key>CFBundleURLTypes</key>')) {
    console.log('  ! CFBundleURLTypes exists but missing Google scheme — skipping (add manually)');
  } else {
    plist = plist.replace(/\n<\/dict>\n<\/plist>\s*$/, `\n${urlTypesBlock}</dict>\n</plist>\n`);
    console.log('  + added CFBundleURLTypes (Google Sign-In)');
    changed = true;
  }
}

if (changed) {
  writeFileSync(PLIST, plist);
  console.log(`OK: patched ${PLIST}`);
} else {
  console.log(`OK: ${PLIST} already contains all required keys — no changes.`);
}

// 3) Ensure Sign in with Apple entitlements exist. Xcode's UI may hide the
// capability if only the plugin is installed; these settings make it permanent.
const entitlementsTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>com.apple.developer.applesignin</key>
\t<array>
\t\t<string>Default</string>
\t</array>
</dict>
</plist>
`;

if (!existsSync(ENTITLEMENTS)) {
  writeFileSync(ENTITLEMENTS, entitlementsTemplate);
  console.log(`  + created ${ENTITLEMENTS} (Sign in with Apple)`);
} else {
  let entitlements = readFileSync(ENTITLEMENTS, 'utf8');
  if (!entitlements.includes('com.apple.developer.applesignin')) {
    entitlements = entitlements.replace(
      /\n<\/dict>\n<\/plist>\s*$/,
      '\n\t<key>com.apple.developer.applesignin</key>\n\t<array>\n\t\t<string>Default</string>\n\t</array>\n</dict>\n</plist>\n'
    );
    writeFileSync(ENTITLEMENTS, entitlements);
    console.log(`  + added Sign in with Apple entitlement to ${ENTITLEMENTS}`);
  } else {
    console.log(`OK: ${ENTITLEMENTS} already contains Sign in with Apple entitlement.`);
  }
}

let pbxproj = readFileSync(PBXPROJ, 'utf8');
let pbxChanged = false;

if (!pbxproj.includes('CODE_SIGN_ENTITLEMENTS = App/App.entitlements;')) {
  pbxproj = pbxproj.replace(
    /(CODE_SIGN_STYLE = Automatic;\n)/g,
    '$1\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;\n'
  );
  pbxChanged = true;
  console.log('  + linked App.entitlements to target build settings');
}

if (!pbxproj.includes('com.apple.SignInWithApple')) {
  pbxproj = pbxproj.replace(
    /(LastSwiftMigration = 1100;\n)(\t+ProvisioningStyle = Automatic;)/,
    '$1\t\t\t\t\t\tSystemCapabilities = {\n\t\t\t\t\t\t\tcom.apple.SignInWithApple = {\n\t\t\t\t\t\t\t\tenabled = 1;\n\t\t\t\t\t\t\t};\n\t\t\t\t\t\t};\n$2'
  );
  pbxChanged = true;
  console.log('  + enabled Sign in with Apple capability in Xcode project');
}

if (pbxChanged) {
  writeFileSync(PBXPROJ, pbxproj);
  console.log(`OK: patched ${PBXPROJ}`);
} else {
  console.log(`OK: ${PBXPROJ} already has Sign in with Apple capability.`);
}