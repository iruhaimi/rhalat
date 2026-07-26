/**
 * Static assets are served from a relative path on the web.
 * Inside the native iOS Capacitor app, the origin is capacitor://localhost
 * so relative asset URLs 404. Rewrite to the production origin when
 * running natively.
 */
import { isIOSApp, isAndroidApp } from '@/lib/platform';

const CDN_ORIGIN = 'https://visafaster.com';

export function assetUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/') && (isIOSApp() || isAndroidApp())) return CDN_ORIGIN + url;
  return url;
}