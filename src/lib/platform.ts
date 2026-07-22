/**
 * Detects whether the app is running inside the native iOS app
 * (Despia wrapper OR Capacitor build). Used to conditionally disable
 * features that conflict with App Store rules:
 * - Google Sign-In via web OAuth (fails inside webview → Guideline 2.1a)
 * - Cookie consent banner (Apple treats cookies as tracking → 5.1.2)
 * - Google Ads gtag (would require ATT → 5.1.2)
 */
import { Capacitor } from '@capacitor/core';

export const isIOSApp = (): boolean => {
  try {
    if (Capacitor?.isNativePlatform?.() && Capacitor.getPlatform() === 'ios') {
      return true;
    }
  } catch {
    // Capacitor not available on web — fall through to UA detection.
  }
  if (typeof navigator === 'undefined') return false;
  return /Despia|VisaFasterIOS/i.test(navigator.userAgent);
};