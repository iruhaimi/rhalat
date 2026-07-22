import { Capacitor } from '@capacitor/core';
import { APP_PUBLIC_ORIGIN } from '@/lib/platform';

const FORBIDDEN_HOST_FRAGMENTS = [
  'lovable.dev',
  'lovable.app',
  'lovableproject.com',
  'lovableproject-dev.com',
];

export function enforceNativeUrlSafety() {
  try {
    if (!Capacitor.isNativePlatform()) return;

    const href = window.location.href.toLowerCase();
    const host = window.location.hostname.toLowerCase();
    const hasForbiddenHost = FORBIDDEN_HOST_FRAGMENTS.some((fragment) => host.includes(fragment));
    const hasForbiddenReference = FORBIDDEN_HOST_FRAGMENTS.some((fragment) => href.includes(fragment));

    if (hasForbiddenHost) {
      window.location.replace(APP_PUBLIC_ORIGIN);
      return;
    }

    if (hasForbiddenReference) {
      window.history.replaceState(null, document.title, '/');
    }
  } catch {
    // Never block app startup because of a defensive URL check.
  }
}