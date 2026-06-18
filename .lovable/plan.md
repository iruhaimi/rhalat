## Why Tag Assistant reports "not found"

The Google Ads tag **is** installed and **is** firing on `visafaster.com` — I verified the live HTML contains both `gtag/js?id=AW-16509107883` and `gtag('config', 'AW-16509107883', { debug_mode: true })`, and the network panel shows live `google.com/ccm/collect` and `rmkt/collect` hits for the AW ID.

The reason Tag Assistant still says "not found" is the Consent Mode v2 setup:

- `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` all default to **denied**
- `ads_data_redaction: true` strips identifiers from outgoing pings

Under these defaults the tag fires in **cookieless / redacted mode** and does not set the `_gcl_*` cookies or send the full hit Tag Assistant looks for. Tag Assistant also can't probe through the cookie banner overlay covering the page. Result: "Tag not found", even though the tag is correctly installed.

We must NOT permanently grant consent by default (that would break Consent Mode compliance for EU/PDPL). Instead, add an explicit, opt-in debug path so Tag Assistant can verify whenever needed.

## Plan

### 1. Add a Tag Assistant debug override in `index.html`
Before the existing `gtag('consent', 'default', ...)` block, check the URL/localStorage for a debug flag. When present, set defaults to **granted** instead of denied so Tag Assistant sees the full tag fire.

Activation methods (any one works):
- Visit `https://visafaster.com/?ta_debug=1` once — stores `ta_debug=1` in `localStorage` for the session
- Or set `localStorage.ta_debug = '1'` manually in DevTools
- Clear with `?ta_debug=0` or `localStorage.removeItem('ta_debug')`

This keeps production behavior unchanged for real users (defaults remain denied) while giving us a reliable verification path.

### 2. Keep `debug_mode: true` for now
Already in place. Leave it until Tag Assistant confirms detection, then we'll remove it in a follow-up.

### 3. Update `/__gtag-check` diagnostic page
Show the current consent state and a one-click button to toggle `ta_debug` on/off, plus a copy-to-clipboard of the Tag Assistant URL (`https://visafaster.com/?ta_debug=1`).

### 4. Republish to visafaster.com and re-verify
After deploy, curl the live HTML to confirm the debug override script is present, then instruct the user to:
1. Open `https://visafaster.com/?ta_debug=1` in a fresh tab
2. Connect Tag Assistant to that URL — it should now detect `AW-16509107883`

### Technical notes
- Files touched: `index.html` (add ~15 lines before the consent default block), `src/pages/GTagCheck.tsx` (add toggle UI). No other code changes.
- No impact on real users: the override only activates when the explicit flag is set.
- Consent Mode v2 compliance remains intact for all normal traffic.
- After Tag Assistant verifies, we'll do a small cleanup pass to remove `debug_mode: true` (one-line revert).
