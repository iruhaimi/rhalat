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
