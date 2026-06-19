Apply the best practice for the Tag Assistant flow: fire an explicit, deduplicated conversion event on the `/payment-success` page so Google detects the purchase reliably without GTM and without double-counting.

## Why this approach
- We're staying on **gtag.js** (no GTM container — that warning is expected and can be ignored).
- The "Existing purchase conversion" warning means Google is auto-detecting an event; explicit firing makes it clean, deduplicated (via `transaction_id`), and removes the double-count risk.

## Changes

**1. `src/pages/PaymentSuccess.tsx`** — add a `useEffect` that:
- Reads `app` (application number) and `via` (whatsapp / paid) from the URL.
- Reads an optional `amount` and `currency` from the URL or sessionStorage (`order_amount_<appNumber>` if available).
- Dedupes by writing `gtag_fired_<appNumber>` to sessionStorage so refreshes don't re-fire.
- Calls `trackConversion('purchase', { value, currency: 'SAR', transaction_id: applicationNumber })` for the paid path.
- Calls `trackConversion('generate_lead', { value: 0, currency: 'SAR', transaction_id: applicationNumber })` for the WhatsApp path (no real revenue yet).

**2. `src/components/apply/steps/Step6Payment.tsx`** (paid path) — when redirecting to `/payment-success`, also append `&amount=<total>&currency=SAR` to the URL so the success page has the real value to send.

**3. `src/lib/gtagEvents.ts`** — no behavior change. Add a tiny `markFired(transaction_id)` / `wasFired(transaction_id)` helper so the dedupe logic lives in one place.

## Out of scope
- No GTM install.
- No backend changes.
- Conversion **Labels** in `CONVERSION_LABELS` stay placeholders — once you create the Conversion Action in Google Ads and send the labels, I'll plug them in. Until then the events still fire as GA4 events.

## Result you'll see
After deploy, place a test order → Tag Assistant detects exactly **one** `purchase` event with a `transaction_id`, no double-count warning. The "Tag manager not found" message will stay (it only applies to GTM users) — that's harmless.