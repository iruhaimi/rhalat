#!/usr/bin/env node
/**
 * Idempotently patches ios/App/App/Info.plist after `npx cap add ios`.
 * Injects:
 *   - Camera / Photo Library / Microphone usage descriptions (Arabic)
 *   - Google Sign-In CFBundleURLTypes entry (reversed iOS client ID)
 *
 * Safe to re-run: skips any key/scheme that already exists.
 * Run automatically by scripts/rebuild-ios.sh; can also be run manually:
 *   node scripts/patch-ios-infoplist.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PLIST = 'ios/App/App/Info.plist';
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