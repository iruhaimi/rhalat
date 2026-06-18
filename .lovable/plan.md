## Ship Google Ads tag, verify, add monitoring

### 1. `index.html` — add temporary `debug_mode`
Change the Ads config line to:
```js
gtag('config', 'AW-16509107883', { debug_mode: true });
```
Leave Consent Mode v2 defaults at `denied` (compliance). Tag Assistant detects the tag from the `gtag/js` script load itself, which fires regardless of consent; `debug_mode` makes events visible in Tag Assistant while consent is still denied.

### 2. New `src/components/analytics/GTagMonitor.tsx`
Client-only, mounted once inside the router in `src/App.tsx` so it observes route changes. On mount and on every `location.pathname` change, checks:
- `window.dataLayer` exists and contains a `config` entry for `AW-16509107883`.
- A `<script src*="googletagmanager.com/gtag/js?id=AW-16509107883">` is present.
- `performance.getEntriesByName(...)` confirms the gtag.js fetch succeeded.

On failure, logs a single grouped `console.error('[gtag-monitor] ...')` with the failing route and check. Renders `null`. No UI, no network calls.

### 3. New `/__gtag-check` diagnostic route
- New file `src/pages/GTagCheck.tsx`, registered in `src/App.tsx`.
- Renders a small page with ✅/❌ status rows for each check plus a `dataLayer` snapshot.
- Adds `<meta name="robots" content="noindex,nofollow">` via the existing `react-helmet-async` setup so it stays out of the index.

### 4. Publish + verification
- Call `preview_ui--publish` with `website_info_status: already_relevant` (title, description, OG, favicon already accurate).
- After publish, fetch `https://visafaster.com/` and grep the HTML for `googletagmanager.com/gtag/js?id=AW-16509107883`. Report the result.

### 5. Closing note
I'll remind you to remove `debug_mode: true` once Tag Assistant verification is complete (one-line revert).

### Out of scope
No changes to `CookieConsent.tsx`, routing structure, other tracking, or business logic.