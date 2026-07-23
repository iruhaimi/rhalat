import type { CapacitorConfig } from '@capacitor/cli';

// IMPORTANT: Never add a `server.url` here. That option makes the native app
// load its UI from a remote URL (preview, staging, etc.) instead of the
// local `dist/` bundle. The mobile build guard will fail if it detects
// `server.url`. Native builds must always use the local bundled web assets.
const config: CapacitorConfig = {
  appId: 'com.visafaster.app',
  appName: 'عطلات رحلاتكم',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile'
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    // Native Google Sign-In for iOS via @capgo/capacitor-social-login (SPM-compatible).
    // Initialization (with the Web Client ID) is done at runtime in the app code.
  },
};

export default config;
