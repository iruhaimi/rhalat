/**
 * Despia native runtime utilities
 * Detects if running inside Despia WebView and provides safe fallbacks
 */

export const isDespia = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /despia/i.test(navigator.userAgent);
};

export const isDespiaIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /despia-iphone|despia-ipad/i.test(navigator.userAgent);
};

export const isDespiaAndroid = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /despia-android/i.test(navigator.userAgent);
};

/**
 * Open an external URL safely from within the native wrapper.
 * Handles the case where the app is loaded inside an iframe/top-window
 * split (used by the WhatsApp deep-link flow) and falls back to a
 * plain window.open with noopener/noreferrer otherwise.
 */
export function openExternalUrl(url: string): void {
  try {
    if (typeof window === 'undefined') return;
    if (window.top && window.top !== window.self) {
      window.top.location.href = url;
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Give up silently — never crash the UI over a link.
    }
  }
}
