/**
 * Google Ads Conversion Tracking helper.
 *
 * Wraps window.gtag with safety checks (existence, Consent Mode v2 state)
 * so callers can fire events anywhere without worrying about SSR, ad-blockers
 * or denied consent.
 *
 * Single source of truth for the conversion contract — keep `CONVERSION_LABELS`
 * in sync with the labels created in Google Ads → Tools → Conversions.
 */

const GOOGLE_ADS_ID = 'AW-16509107883';

/**
 * Conversion labels from Google Ads → Tools → Conversions.
 * Replace the placeholder values with the real `<ID>/<Label>` strings once the
 * conversion actions are created in Google Ads. Until then the events are
 * still sent as standard GA4 events (useful for GA4 + Audiences) but they
 * will not register as Google Ads conversions.
 */
// ⚠️ TODO: استبدل REPLACE_ME بـ Conversion Label من Google Ads
// Tools → Conversions → افتح كل تحويل → انسخ Conversion ID/Label
// مثال نهائي: 'AW-16509107883/abCdEfGhIjK'
const CONVERSION_LABELS: Partial<Record<ConversionEvent, string>> = {
  // purchase: `${GOOGLE_ADS_ID}/REPLACE_ME_PURCHASE`,
  // submit_application: `${GOOGLE_ADS_ID}/REPLACE_ME_SUBMIT`,
  // sign_up: `${GOOGLE_ADS_ID}/REPLACE_ME_SIGNUP`,
  // generate_lead: `${GOOGLE_ADS_ID}/REPLACE_ME_LEAD`,
  // begin_checkout: `${GOOGLE_ADS_ID}/REPLACE_ME_CHECKOUT`,
};

export type ConversionEvent =
  | 'purchase'
  | 'submit_application'
  | 'sign_up'
  | 'generate_lead'
  | 'begin_checkout';

export interface ConversionPayload {
  /** Monetary value of the conversion. 0 for non-revenue events. */
  value?: number;
  /** ISO currency code, e.g. 'SAR'. Defaults to 'SAR'. */
  currency?: string;
  /** Unique id to deduplicate (required for `purchase`). */
  transaction_id?: string;
  /** Extra event params (e.g. items, coupon). */
  [key: string]: unknown;
}

export interface EnhancedConversionUserData {
  email?: string;
  phone_number?: string; // E.164 format recommended
  address?: {
    first_name?: string;
    last_name?: string;
    country?: string;
  };
}

type GtagFn = (...args: unknown[]) => void;

function getGtag(): GtagFn | null {
  if (typeof window === 'undefined') return null;
  const g = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof g === 'function' ? g : null;
}

/**
 * Best-effort Consent Mode v2 check. We do NOT block the event when consent
 * state cannot be read — Google's own gtag handles denied state by sending a
 * cookieless ping, which still feeds modeled conversions.
 */
function hasAdConsent(): boolean {
  try {
    // Cookiebot / common CMPs expose granted state on window
    const w = window as unknown as {
      Cookiebot?: { consent?: { marketing?: boolean } };
    };
    if (w.Cookiebot?.consent) return w.Cookiebot.consent.marketing !== false;
  } catch {}
  return true;
}

/**
 * Attach hashed user identifiers for Enhanced Conversions.
 * gtag.js hashes the values with SHA-256 before sending — do not pre-hash.
 * Call before `trackConversion('purchase', ...)`.
 */
export function setEnhancedConversionUserData(userData: EnhancedConversionUserData): void {
  const gtag = getGtag();
  if (!gtag) return;
  const clean: Record<string, unknown> = {};
  if (userData.email) clean.email = userData.email.trim().toLowerCase();
  if (userData.phone_number) clean.phone_number = userData.phone_number.replace(/\s+/g, '');
  if (userData.address) clean.address = userData.address;
  try {
    gtag('set', 'user_data', clean);
  } catch (err) {
    console.warn('[gtag] setEnhancedConversionUserData failed', err);
  }
}

/**
 * Fire a Google Ads conversion + GA4 event.
 * Safe to call when gtag is missing, in SSR, or when consent is denied.
 */
export function trackConversion(
  event: ConversionEvent,
  payload: ConversionPayload = {}
): void {
  const gtag = getGtag();
  if (!gtag) return;
  if (!hasAdConsent()) return;

  const { value = 0, currency = 'SAR', transaction_id, ...rest } = payload;

  const eventParams: Record<string, unknown> = {
    value,
    currency,
    ...rest,
  };
  if (transaction_id) eventParams.transaction_id = transaction_id;

  // Standard GA4 event (always sent — feeds GA4 + audience lists)
  try {
    gtag('event', event, eventParams);
  } catch (err) {
    console.warn(`[gtag] event ${event} failed`, err);
  }

  // Google Ads conversion (only if a label is configured)
  const label = CONVERSION_LABELS[event];
  if (label) {
    try {
      gtag('event', 'conversion', {
        send_to: label,
        value,
        currency,
        ...(transaction_id ? { transaction_id } : {}),
      });
    } catch (err) {
      console.warn(`[gtag] conversion ${event} failed`, err);
    }
  }
}

export const GOOGLE_ADS_CONVERSION_ID = GOOGLE_ADS_ID;

/**
 * Lightweight dedupe for conversion events keyed by transaction_id.
 * Uses sessionStorage so that refreshing the success page won't re-fire
 * the same purchase. A successful payment in a new session (after
 * sessionStorage is cleared) will still fire — which is correct.
 */
const FIRED_KEY_PREFIX = 'gtag_fired_';

export function wasConversionFired(transactionId: string): boolean {
  if (typeof window === 'undefined' || !transactionId) return false;
  try {
    return sessionStorage.getItem(FIRED_KEY_PREFIX + transactionId) === '1';
  } catch {
    return false;
  }
}

export function markConversionFired(transactionId: string): void {
  if (typeof window === 'undefined' || !transactionId) return;
  try {
    sessionStorage.setItem(FIRED_KEY_PREFIX + transactionId, '1');
  } catch {}
}