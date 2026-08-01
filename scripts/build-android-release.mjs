#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const versionCode = String(process.env.ANDROID_VERSION_CODE || '4');
const versionName = process.env.ANDROID_VERSION_NAME || '1.0.3';
const gradleFile = path.join(root, 'android/app/build.gradle');
const sourceAab = path.join(root, 'android/app/build/outputs/bundle/release/app-release.aab');
const releasesDir = path.join(root, 'android/releases');
const finalAab = path.join(releasesDir, `visafaster-v${versionCode}-${versionName}.aab`);
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const startedAt = Date.now();

function run(command, args, cwd = root, env = process.env) {
  execFileSync(command, args, { cwd, env, stdio: 'inherit' });
}

if (!/^\d+$/.test(versionCode) || Number(versionCode) < 4) {
  throw new Error('ANDROID_VERSION_CODE must be an integer of 4 or higher.');
}

run(npmCommand, ['run', 'build']);
run('npx', ['cap', 'sync', 'android']);
run(npmCommand, ['run', 'android:patch']);
run(npmCommand, ['run', 'android:version'], root, {
  ...process.env,
  ANDROID_VERSION_CODE: versionCode,
  ANDROID_VERSION_NAME: versionName,
});
run(npmCommand, ['run', 'android:signing']);

const gradle = readFileSync(gradleFile, 'utf8');
if (!new RegExp(`versionCode\\s+${versionCode}\\b`).test(gradle)) {
  throw new Error(`Release stopped: Gradle does not contain versionCode ${versionCode}.`);
}
if (!gradle.includes(`versionName "${versionName}"`)) {
  throw new Error(`Release stopped: Gradle does not contain versionName "${versionName}".`);
}

rmSync(path.dirname(sourceAab), { recursive: true, force: true });
run(gradleCommand, ['clean', 'bundleRelease'], path.join(root, 'android'));

if (!existsSync(sourceAab)) {
  throw new Error('Release stopped: Gradle did not create app-release.aab.');
}
const sourceStat = statSync(sourceAab);
if (sourceStat.size === 0 || sourceStat.mtimeMs < startedAt) {
  throw new Error('Release stopped: generated AAB is empty or stale.');
}

mkdirSync(releasesDir, { recursive: true });
copyFileSync(sourceAab, finalAab);
const sha256 = createHash('sha256').update(readFileSync(finalAab)).digest('hex');

console.log('\n============================================================');
console.log('NEW AAB VERIFIED AND READY FOR GOOGLE PLAY');
console.log(`versionCode: ${versionCode}`);
console.log(`versionName: ${versionName}`);
console.log(`file: ${finalAab}`);
console.log(`size: ${statSync(finalAab).size} bytes`);
console.log(`SHA-256: ${sha256}`);
console.log('Upload ONLY the versioned file above, not app-release.aab.');
console.log('============================================================\n');