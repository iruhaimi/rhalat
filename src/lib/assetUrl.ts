/**
 * Lovable Assets are served from a relative path (/__l5e/assets-v1/...).
 * Inside the native iOS Capacitor app, the origin is capacitor://localhost
 * so relative asset URLs 404. Rewrite to the production CDN origin when
 * running natively.
 */
import { isIOSApp } from '@/lib/platform';

const CDN_ORIGIN = 'https://visafaster.com';

export function assetUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/') && isIOSApp()) return CDN_ORIGIN + url;
  return url;
}