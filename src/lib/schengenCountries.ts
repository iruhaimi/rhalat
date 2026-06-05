// Schengen countries configuration
// These country codes represent EU Schengen zone countries

export const SCHENGEN_COUNTRY_CODES = ['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'CH', 'BE', 'PT', 'GR', 'CZ', 'PL', 'SE', 'DK', 'NO', 'FI'] as const;

export const SCHENGEN_INFO = {
  id: 'schengen',
  name: 'شنغن (الاتحاد الأوروبي)',
  nameEn: 'Schengen (EU)',
  code: 'SCHENGEN',
  flag_url: 'https://flagcdn.com/eu.svg',
  is_active: true,
};

export function isSchengenCountry(countryCode: string): boolean {
  return SCHENGEN_COUNTRY_CODES.includes(countryCode as typeof SCHENGEN_COUNTRY_CODES[number]);
}

export function filterOutSchengenCountries<T extends { code: string }>(countries: T[]): T[] {
  return countries.filter(country => !isSchengenCountry(country.code));
}

export function getSchengenCountries<T extends { code: string }>(countries: T[]): T[] {
  return countries.filter(country => isSchengenCountry(country.code));
}
