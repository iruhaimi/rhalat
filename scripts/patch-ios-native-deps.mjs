#!/usr/bin/env node
/**
 * Keeps iOS native dependencies aligned with the app's real login providers.
 *
 * We use @capgo/capacitor-social-login only for Google Sign-In. Its default
 * Swift Package includes Facebook/Twitter/Apple helper dependencies as well,
 * which makes Xcode resolve unused Facebook packages and can fail with
 * "Missing package product FacebookCore/FacebookLogin" or XCFramework errors.
 *
 * Safe to run before every `npx cap sync ios` and after every `npm install`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const SOCIAL_LOGIN_PACKAGE = 'node_modules/@capgo/capacitor-social-login/Package.swift';
const SOCIAL_LOGIN_PODSPEC = 'node_modules/@capgo/capacitor-social-login/CapgoCapacitorSocialLogin.podspec';

function patchFile(path, patcher) {
  if (!existsSync(path)) {
    console.log(`WARN: ${path} not found — run npm install first.`);
    return;
  }

  const before = readFileSync(path, 'utf8');
  const after = patcher(before);

  if (after === before) {
    console.log(`OK: ${path} already uses Google-only iOS dependencies.`);
    return;
  }

  writeFileSync(path, after);
  console.log(`OK: patched ${path} to remove unused Facebook/Apple/Twitter iOS dependencies.`);
}

patchFile(SOCIAL_LOGIN_PACKAGE, (source) => {
  let next = source;

  // Remove unused package declarations. Google Sign-In is the only provider
  // invoked by src/components/auth/GoogleSignInButton.tsx.
  next = next.replace(/\n\s*\/\/ FBSDKCoreKit and FBSDKLoginKit\n\s*\.package\(url: "https:\/\/github\.com\/facebook\/facebook-ios-sdk\.git", \.upToNextMajor\(from: "[^"]+"\)\),/g, '');
  next = next.replace(/\n\s*\/\/ Alamofire\n\s*\.package\(url: "https:\/\/github\.com\/Alamofire\/Alamofire\.git", \.upToNextMajor\(from: "[^"]+"\)\),/g, '');

  // Remove unused product dependencies from the SocialLogin target.
  next = next.replace(/\n\s*\.product\(name: "FacebookCore", package: "facebook-ios-sdk"\),/g, '');
  next = next.replace(/\n\s*\.product\(name: "FacebookLogin", package: "facebook-ios-sdk"\),/g, '');
  next = next.replace(/\n\s*\.product\(name: "Alamofire", package: "Alamofire"\),/g, '');

  return next;
});

patchFile(SOCIAL_LOGIN_PODSPEC, (source) => {
  let next = source;
  next = next.replace(/\n\s*s\.dependency 'FBSDKCoreKit', '~> 18\.0'.*/g, "\n  # s.dependency 'FBSDKCoreKit', '~> 18.0'  # Disabled: app does not use Facebook login");
  next = next.replace(/\n\s*s\.dependency 'FBSDKLoginKit', '~> 18\.0'.*/g, "\n  # s.dependency 'FBSDKLoginKit', '~> 18.0'  # Disabled: app does not use Facebook login");
  next = next.replace(/\n\s*s\.dependency 'Alamofire', '~> 5\.10\.2'.*/g, "\n  # s.dependency 'Alamofire', '~> 5.10.2'  # Disabled: Apple login uses @capacitor-community/apple-sign-in");
  return next;
});