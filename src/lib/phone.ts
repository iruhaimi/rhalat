/**
 * Saudi phone normalization utilities.
 * Canonical storage format: 9 digits, no prefix (e.g. "558882878").
 * Display format: "+966XXXXXXXXX".
 */

export function normalizeSaudiPhone(raw?: string | null): string {
  if (!raw) return '';
  // Strip everything except digits
  let digits = String(raw).replace(/\D/g, '');
  // Remove international/country/trunk prefixes
  if (digits.startsWith('00966')) digits = digits.slice(5);
  else if (digits.startsWith('966')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 9);
}

export function formatSaudiPhone(raw?: string | null): string {
  const n = normalizeSaudiPhone(raw);
  return n ? `+966${n}` : '';
}

export function formatSaudiPhoneSpaced(raw?: string | null): string {
  const n = normalizeSaudiPhone(raw);
  return n ? `+966 ${n}` : '';
}