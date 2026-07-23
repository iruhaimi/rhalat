import type { CapacitorConfig } from '@capacitor/cli';

// IMPORTANT: Never add a `server.url` here. That option makes the native app
// load its UI from a remote URL (Lovable preview, staging, etc.) instead of
// the local `dist/` bundle. The mobile build guard will fail if it detects
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
    GoogleAuth: {
      // Web/Server OAuth Client ID from Google Cloud Console.
      // The idToken returned by the native SDK will have this as its `aud`,
      // which matches what Supabase Auth is configured with.
      scopes: ['profile', 'email'],
      serverClientId: '__REPLACE_WITH_WEB_CLIENT_ID__.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
