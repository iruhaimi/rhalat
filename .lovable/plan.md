## Plan: Add Google Ads Tag (AW-16509107883)

Since this is a React single-page application, adding the tag to `index.html` covers every page automatically.

### What will change

**File: `index.html`**

Insert the Google `gtag.js` script loader + configuration immediately after the existing Consent Mode v2 script block (which already defines `window.dataLayer` and `gtag`).

Changes:
1. Add the async `gtag.js` script: `https://www.googletagmanager.com/gtag/js?id=AW-16509107883`
2. Add `gtag('js', new Date());`
3. Add `gtag('config', 'AW-16509107883');`

The existing Consent Mode block already initializes `dataLayer` and `gtag`, so the new inline script will reuse those definitions without duplication.

### No other files touched
- No changes to components, routes, or business logic.
- No changes to CookieConsent or other tracking infrastructure.