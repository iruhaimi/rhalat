#!/usr/bin/env node
/**
 * Injects a release signingConfig into android/app/build.gradle that reads
 * credentials from android/keystore.properties (git-ignored).
 *
 * keystore.properties format:
 *   storeFile=/absolute/path/to/upload-keystore.jks
 *   storePassword=...
 *   keyAlias=upload
 *   keyPassword=...
 */
import fs from 'node:fs';
import path from 'node:path';

const gradlePath = path.resolve('android/app/build.gradle');
if (!fs.existsSync(gradlePath)) {
  console.error('android/app/build.gradle not found. Run `npx cap add android` first.');
  process.exit(1);
}

const propsPath = path.resolve('android/keystore.properties');
if (!fs.existsSync(propsPath)) {
  console.error(
    'android/keystore.properties not found. Create it with:\n' +
      '  storeFile=/absolute/path/to/upload-keystore.jks\n' +
      '  storePassword=YOUR_STORE_PASSWORD\n' +
      '  keyAlias=upload\n' +
      '  keyPassword=YOUR_KEY_PASSWORD'
  );
  process.exit(1);
}

let gradle = fs.readFileSync(gradlePath, 'utf8');

if (gradle.includes('RELEASE_SIGNING_INJECTED')) {
  console.log('Signing config already present in android/app/build.gradle.');
  process.exit(0);
}

const loader = `// RELEASE_SIGNING_INJECTED
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

`;
gradle = loader + gradle;

const signingBlock = `
    signingConfigs {
        release {
            if (keystoreProperties['storeFile']) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
`;

gradle = gradle.replace(/android\s*\{/, (m) => m + signingBlock);

gradle = gradle.replace(
  /(buildTypes\s*\{\s*release\s*\{)/,
  '$1\n            signingConfig signingConfigs.release'
);

fs.writeFileSync(gradlePath, gradle, 'utf8');
console.log('Release signing config injected into android/app/build.gradle.');
