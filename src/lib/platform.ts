/**
 * Detects whether the app is running inside the Despia-wrapped iOS app.
 * Used to conditionally disable features that conflict with App Store rules:
 * - Google Sign-In (fails inside webview → Guideline 2.1a)
 * - Cookie consent banner (Apple treats cookies as tracking → 5.1.2)
 * - Google Ads gtag (would require ATT → 5.1.2)
 */
export const isIOSApp = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Despia|VisaFasterIOS/i.test(navigator.userAgent);
};