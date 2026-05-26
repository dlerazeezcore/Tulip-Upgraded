// Country dial codes for the phone field. `iso` feeds the <Flag> component.
export type Country = { iso: string; name: string; dial: string };

// Iraq first (primary market); then a broad common set. Extend as needed.
export const COUNTRIES: Country[] = [
  { iso: 'IQ', name: 'Iraq', dial: '964' },
  { iso: 'US', name: 'United States', dial: '1' },
  { iso: 'GB', name: 'United Kingdom', dial: '44' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '966' },
  { iso: 'TR', name: 'Türkiye', dial: '90' },
  { iso: 'JO', name: 'Jordan', dial: '962' },
  { iso: 'EG', name: 'Egypt', dial: '20' },
  { iso: 'KW', name: 'Kuwait', dial: '965' },
  { iso: 'QA', name: 'Qatar', dial: '974' },
  { iso: 'BH', name: 'Bahrain', dial: '973' },
  { iso: 'OM', name: 'Oman', dial: '968' },
  { iso: 'LB', name: 'Lebanon', dial: '961' },
  { iso: 'IR', name: 'Iran', dial: '98' },
  { iso: 'DE', name: 'Germany', dial: '49' },
  { iso: 'FR', name: 'France', dial: '33' },
  { iso: 'IT', name: 'Italy', dial: '39' },
  { iso: 'ES', name: 'Spain', dial: '34' },
  { iso: 'NL', name: 'Netherlands', dial: '31' },
  { iso: 'SE', name: 'Sweden', dial: '46' },
  { iso: 'CH', name: 'Switzerland', dial: '41' },
  { iso: 'CA', name: 'Canada', dial: '1' },
  { iso: 'AU', name: 'Australia', dial: '61' },
  { iso: 'IN', name: 'India', dial: '91' },
  { iso: 'PK', name: 'Pakistan', dial: '92' },
  { iso: 'CN', name: 'China', dial: '86' },
  { iso: 'JP', name: 'Japan', dial: '81' },
  { iso: 'RU', name: 'Russia', dial: '7' },
  { iso: 'BR', name: 'Brazil', dial: '55' },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0];

export function findCountryByIso(iso: string | null | undefined): Country | undefined {
  if (!iso) return undefined;
  const upper = iso.toUpperCase();
  return COUNTRIES.find((c) => c.iso === upper);
}

/** Normalize a country dial + locally-typed number into E.164, stripping the
 *  national trunk zero (e.g. IQ 0750… -> +964750…). */
export function toE164(dial: string, localNumber: string): string {
  let digits = (localNumber || '').replace(/\D/g, '');
  // Drop a single leading trunk zero used in national notation.
  digits = digits.replace(/^0+/, '');
  return `+${dial}${digits}`;
}
