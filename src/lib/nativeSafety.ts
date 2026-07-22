import { Capacitor } from '@capacitor/core';

const FORBIDDEN_HOST_FRAGMENTS = [
  'lovable.dev',
  'lovable.app',
  'lovableproject.com',
  'lovableproject-dev.com',
];

function isForbidden(value: string | null | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return FORBIDDEN_HOST_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

/**
 * Hard lock the native WebView to the local bundled app only.
 * If ANY code path tries to send the user to a Lovable-hosted URL,
 * we neutralize it before the browser can navigate.
 */
export function enforceNativeUrlSafety() {
  try {
    if (!Capacitor.isNativePlatform()) return;

    // 1) Unregister ANY lingering service worker (kill-switch cleanup).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch(() => undefined);
    }

    // 2) If the current page itself is a Lovable host, wipe it to `/`.
    const currentHost = window.location.hostname.toLowerCase();
    if (isForbidden(currentHost)) {
      window.history.replaceState(null, document.title, '/');
      window.location.replace('/');
      return;
    }

    // 3) Neutralize any future navigation attempt to a Lovable host.
    try {
      const originalAssign = window.location.assign.bind(window.location);
      const originalReplace = window.location.replace.bind(window.location);
      const originalOpen = window.open.bind(window);

      window.location.assign = ((url: string) => {
        if (isForbidden(url)) return;
        return originalAssign(url);
      }) as typeof window.location.assign;

      window.location.replace = ((url: string) => {
        if (isForbidden(url)) return;
        return originalReplace(url);
      }) as typeof window.location.replace;

      window.open = ((url?: string | URL, target?: string, features?: string) => {
        if (typeof url === 'string' && isForbidden(url)) return null;
        if (url instanceof URL && isForbidden(url.href)) return null;
        return originalOpen(url as string, target as string, features as string);
      }) as typeof window.open;
    } catch {
      // Non-fatal: if the browser froze these props, safety layer 2 still catches boot-time Lovable URLs.
    }
  } catch {
    // Never block app startup because of a defensive URL check.
  }
}