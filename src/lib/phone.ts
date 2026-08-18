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
// ---------------------------------------------------------------------------
// Generic country-code aware helpers (used by every phone input that has a
// country code selector: Profile, Contact, tourism booking, etc.)
// ---------------------------------------------------------------------------

export interface PhoneCountry {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: '+966', name: 'السعودية', nameEn: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', name: 'الإمارات', nameEn: 'UAE', flag: '🇦🇪' },
  { code: '+973', name: 'البحرين', nameEn: 'Bahrain', flag: '🇧🇭' },
  { code: '+974', name: 'قطر', nameEn: 'Qatar', flag: '🇶🇦' },
  { code: '+965', name: 'الكويت', nameEn: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', name: 'عمان', nameEn: 'Oman', flag: '🇴🇲' },
  { code: '+20', name: 'مصر', nameEn: 'Egypt', flag: '🇪🇬' },
  { code: '+962', name: 'الأردن', nameEn: 'Jordan', flag: '🇯🇴' },
  { code: '+961', name: 'لبنان', nameEn: 'Lebanon', flag: '🇱🇧' },
  { code: '+963', name: 'سوريا', nameEn: 'Syria', flag: '🇸🇾' },
  { code: '+964', name: 'العراق', nameEn: 'Iraq', flag: '🇮🇶' },
  { code: '+967', name: 'اليمن', nameEn: 'Yemen', flag: '🇾🇪' },
  { code: '+970', name: 'فلسطين', nameEn: 'Palestine', flag: '🇵🇸' },
  { code: '+212', name: 'المغرب', nameEn: 'Morocco', flag: '🇲🇦' },
  { code: '+213', name: 'الجزائر', nameEn: 'Algeria', flag: '🇩🇿' },
  { code: '+216', name: 'تونس', nameEn: 'Tunisia', flag: '🇹🇳' },
  { code: '+218', name: 'ليبيا', nameEn: 'Libya', flag: '🇱🇾' },
  { code: '+249', name: 'السودان', nameEn: 'Sudan', flag: '🇸🇩' },
  { code: '+90', name: 'تركيا', nameEn: 'Turkey', flag: '🇹🇷' },
  { code: '+44', name: 'بريطانيا', nameEn: 'UK', flag: '🇬🇧' },
  { code: '+1', name: 'أمريكا', nameEn: 'USA', flag: '🇺🇸' },
  { code: '+33', name: 'فرنسا', nameEn: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'ألمانيا', nameEn: 'Germany', flag: '🇩🇪' },
  { code: '+91', name: 'الهند', nameEn: 'India', flag: '🇮🇳' },
  { code: '+92', name: 'باكستان', nameEn: 'Pakistan', flag: '🇵🇰' },
  { code: '+60', name: 'ماليزيا', nameEn: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', name: 'إندونيسيا', nameEn: 'Indonesia', flag: '🇮🇩' },
  { code: '+86', name: 'الصين', nameEn: 'China', flag: '🇨🇳' },
];

/**
 * Splits a stored phone value (ideally E.164, e.g. "+966558882878") into the
 * country dial code and the national digits, so a country-code picker can be
 * re-selected correctly when editing an existing value.
 *
 * Codes are matched longest-first so e.g. "+966..." is never mistaken for a
 * shorter overlapping prefix.
 */
export function parsePhoneWithCountry(
  raw?: string | null,
  defaultCode: string = '+966'
): { countryCode: string; national: string } {
  if (!raw) return { countryCode: defaultCode, national: '' };
  const s = String(raw).trim();
  if (!s) return { countryCode: defaultCode, national: '' };

  if (s.startsWith('+')) {
    const sortedCodes = [...PHONE_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
    for (const c of sortedCodes) {
      if (s.startsWith(c.code)) {
        return { countryCode: c.code, national: s.slice(c.code.length).replace(/\D/g, '') };
      }
    }
  }
  // No recognizable "+code" prefix — treat the whole thing as national digits.
  return { countryCode: defaultCode, national: s.replace(/\D/g, '') };
}

/** Combines a dial code + national digits into a single E.164-style string. */
export function buildE164Phone(countryCode: string, national?: string | null): string {
  const digits = String(national || '').replace(/\D/g, '');
  if (!digits) return '';
  return `${countryCode}${digits}`;
}

/** Digits-only national-number check; Saudi numbers must be exactly 9 digits. */
export function isValidNationalPhone(countryCode: string, national?: string | null): boolean {
  const digits = String(national || '').replace(/\D/g, '');
  if (!digits || digits.length !== (national || '').length) return false;
  if (countryCode === '+966') return digits.length === 9;
  return digits.length >= 4 && digits.length <= 14;
}
