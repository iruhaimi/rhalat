# Plan: Disable Google Ads / gtag inside iOS Despia app

**Goal:** No advertising or tracking events sent to Google from the iOS native app (Despia WebView on iPhone/iPad), so we can declare "Data Not Used to Track You" in App Privacy and skip Apple's ATT prompt. Web (Safari/Chrome/Android) behavior is unchanged.

**Detection signal:** `navigator.userAgent` contains `despia-iphone` or `despia-ipad` (already exposed by `src/lib/despia.ts` via `isDespiaIOS()`).

## Changes

### 1. `index.html` — gate the gtag bootstrap
Wrap the two gtag blocks in a runtime check. Before installing the `dataLayer` shim and injecting `https://www.googletagmanager.com/gtag/js?id=AW-16509107883`, compute:

```js
var __isDespiaIOS = /despia-iphone|despia-ipad/i.test(navigator.userAgent || '');
```

If `__isDespiaIOS === true`:
- Do **not** inject the `googletagmanager.com/gtag/js` `<script>` tag.
- Install a **no-op** `window.gtag = function(){}` and `window.dataLayer = []` so any downstream `window.gtag(...)` call is silently swallowed (belt-and-suspenders — matches how `getGtag()` in `src/lib/gtagEvents.ts` already checks for existence).
- Skip the Consent Mode `gtag('consent', 'default', …)` calls, `ads_data_redaction`, `url_passthrough`, and the `gtag('config', …)` call.

Web behavior (all non-Despia-iOS browsers, incl. Android Despia and iOS Safari outside the app) is untouched — the existing consent-denied default + gtag.js load continues to run exactly as today.

### 2. `src/lib/gtagEvents.ts` — hard guard in the TS wrapper
Add an early-return inside `getGtag()` (or a small helper `isGtagDisabled()`) that returns `null` when `/despia-iphone|despia-ipad/i.test(navigator.userAgent)`. This ensures:
- `trackConversion(...)` becomes a no-op on iOS app (no `gtag('event', ...)`, no `gtag('event', 'conversion', ...)`).
- `setEnhancedConversionUserData(...)` becomes a no-op — **no hashed email/phone sent to Google** from the iOS app.

Web path is unchanged (returns the real `window.gtag`).

### 3. `src/components/analytics/GTagMonitor.tsx` — skip diagnostic on iOS app
Return `null` and skip `runGTagChecks()` when `isDespiaIOS()` is true, so we don't log "checks failed" noise on iOS.

## Files touched

- `index.html` — wrap gtag bootstrap in an iOS-app skip guard
- `src/lib/gtagEvents.ts` — no-op `getGtag()` and `setEnhancedConversionUserData()` on iOS app
- `src/components/analytics/GTagMonitor.tsx` — bail on iOS app

No changes to: Supabase, OneSignal/Despia push code, payments, UI, routes, or any web-facing logic.

## Verification

- Playwright with UA `Mozilla/5.0 despia-iphone`: confirm `window.gtag` exists but is a no-op, no `googletagmanager.com` network request, `dataLayer` empty.
- Default UA: confirm `googletagmanager.com/gtag/js?id=AW-16509107883` still loads and dataLayer receives the `config` entry (unchanged behavior).

## App Store Privacy impact

After this change, the iOS app collects **no advertising data and no tracking identifiers shared with third parties**. You can safely answer:
- **App Tracking Transparency:** Not required — declare "Data Not Used to Track You".
- **Data Used to Track You:** None.
- **Google/Advertising SDKs:** Not present in iOS app.
