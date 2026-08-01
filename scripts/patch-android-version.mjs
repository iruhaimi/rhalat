#!/usr/bin/env node
/**
 * Sets the Android release version in android/app/build.gradle.
 * Google Play rejects re-uploads with the same versionCode, so every new AAB
 * needs a higher versionCode than the previously uploaded (rejected) build.
 *
 * Usage:
 *   node scripts/patch-android-version.mjs            # uses defaults below
 *   ANDROID_VERSION_CODE=3 ANDROID_VERSION_NAME=1.0.2 node scripts/patch-android-version.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const VERSION_CODE = Number(process.env.ANDROID_VERSION_CODE || 2);
const VERSION_NAME = process.env.ANDROID_VERSION_NAME || '1.0.1';

const gradlePath =
  process.env.ANDROID_BUILD_GRADLE_PATH || path.resolve('android/app/build.gradle');

if (!fs.existsSync(gradlePath)) {
  console.error(
    `android/app/build.gradle not found at ${gradlePath}.\n` +
      'Run `npx cap add android` (then `npx cap sync android`) first.'
  );
  process.exit(1);
}

let gradle = fs.readFileSync(gradlePath, 'utf8');

if (!/versionCode\s+\d+/.test(gradle) || !/versionName\s+"[^"]*"/.test(gradle)) {
  console.error('Could not find versionCode/versionName in build.gradle.');
  process.exit(1);
}

gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${VERSION_CODE}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${VERSION_NAME}"`);

fs.writeFileSync(gradlePath, gradle);
console.log(`Android version set: versionCode ${VERSION_CODE}, versionName "${VERSION_NAME}".`);
