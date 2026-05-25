const photo = (id: string, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const POPULAR_COUNTRIES = [
  { iso: 'JP', name: 'Japan',     from: 4.5, hue: '#ef4444', photo: photo('photo-1545569341-9eb8b30979d9') },
  { iso: 'FR', name: 'France',    from: 5.0, hue: '#3b82f6', photo: photo('photo-1502602898657-3e91760cbb34') },
  { iso: 'TH', name: 'Thailand',  from: 3.5, hue: '#10b981', photo: photo('photo-1528181304800-259b08848526') },
  { iso: 'US', name: 'USA',       from: 6.0, hue: '#6366f1', photo: photo('photo-1485871981521-5b1fd3805eee') },
  { iso: 'IT', name: 'Italy',     from: 5.5, hue: '#f59e0b', photo: photo('photo-1525874684015-58379d421a52') },
  { iso: 'ES', name: 'Spain',     from: 4.0, hue: '#dc2626', photo: photo('photo-1543783207-ec64e4d95325') },
];

export const ACTIVE_ESIM = {
  country: 'Japan',
  iso: 'JP',
  used: 2.3,
  total: 5,
  daysLeft: 8,
};

// ─── eSIM catalogue: countries + regions + bundles ───

export type RegionId = 'europe' | 'mena' | 'asia' | 'americas' | 'global';

export type EsimCountry = {
  iso: string;
  name: string;
  region: RegionId;
  fromUsd: number;
};

export const ESIM_COUNTRIES: EsimCountry[] = [
  { iso: 'JP', name: 'Japan',          region: 'asia',     fromUsd: 4.5 },
  { iso: 'KR', name: 'South Korea',    region: 'asia',     fromUsd: 5.0 },
  { iso: 'CN', name: 'China',          region: 'asia',     fromUsd: 6.0 },
  { iso: 'TH', name: 'Thailand',       region: 'asia',     fromUsd: 3.5 },
  { iso: 'FR', name: 'France',         region: 'europe',   fromUsd: 5.0 },
  { iso: 'IT', name: 'Italy',          region: 'europe',   fromUsd: 5.5 },
  { iso: 'ES', name: 'Spain',          region: 'europe',   fromUsd: 4.0 },
  { iso: 'GB', name: 'United Kingdom', region: 'europe',   fromUsd: 5.5 },
  { iso: 'DE', name: 'Germany',        region: 'europe',   fromUsd: 5.0 },
  { iso: 'TR', name: 'Türkiye',        region: 'europe',   fromUsd: 4.5 },
  { iso: 'AE', name: 'United Arab Emirates', region: 'mena', fromUsd: 6.5 },
  { iso: 'SA', name: 'Saudi Arabia',   region: 'mena',     fromUsd: 6.0 },
  { iso: 'IQ', name: 'Iraq',           region: 'mena',     fromUsd: 5.0 },
  { iso: 'EG', name: 'Egypt',          region: 'mena',     fromUsd: 4.0 },
  { iso: 'US', name: 'United States',  region: 'americas', fromUsd: 6.0 },
  { iso: 'CA', name: 'Canada',         region: 'americas', fromUsd: 6.5 },
];

export type EsimRegion = {
  id: RegionId;
  name: string;
  blurb: string;
  fromUsd: number;
  photo: string;
  countries: string[]; // ISO-2 codes covered
};

export const ESIM_REGIONS: EsimRegion[] = [
  {
    id: 'europe', name: 'Europe', blurb: '36 countries · one eSIM', fromUsd: 7,
    photo: photo('photo-1502602898657-3e91760cbb34'),
    countries: ['FR', 'IT', 'ES', 'GB', 'DE', 'TR', 'NL', 'BE', 'CH', 'AT', 'PT', 'GR', 'IE', 'PL', 'SE', 'NO'],
  },
  {
    id: 'mena', name: 'Middle East', blurb: 'Gulf & Levant coverage', fromUsd: 8,
    photo: photo('photo-1512453979798-5ea266f8880c'),
    countries: ['AE', 'SA', 'IQ', 'EG', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB'],
  },
  {
    id: 'asia', name: 'Asia Pacific', blurb: 'Across 14 destinations', fromUsd: 8,
    photo: photo('photo-1528181304800-259b08848526'),
    countries: ['JP', 'KR', 'CN', 'TH', 'SG', 'MY', 'ID', 'VN', 'PH', 'HK', 'TW', 'IN', 'AU', 'NZ'],
  },
  {
    id: 'americas', name: 'Americas', blurb: 'North & South America', fromUsd: 9,
    photo: photo('photo-1485871981521-5b1fd3805eee'),
    countries: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE'],
  },
  {
    id: 'global', name: 'Global', blurb: '120+ countries worldwide', fromUsd: 19,
    photo: photo('photo-1451187580459-43490279c0fa'),
    countries: ['JP', 'FR', 'US', 'GB', 'AE', 'TH', 'DE', 'IT', 'ES', 'CA', 'SA', 'TR', 'KR', 'EG', 'AU', 'BR'],
  },
];

export type Bundle = {
  id: string;
  placeId: string;
  type: 'fixed' | 'unlimited';
  gb: number | null; // null = unlimited
  days: number;
  usd: number;
  popular?: boolean;
};

const round = (n: number) => Math.round(n * 2) / 2;

/** Deterministic mock bundles for a place (country iso or region id). */
export function bundlesFor(placeId: string, base: number, type: 'fixed' | 'unlimited'): Bundle[] {
  if (type === 'fixed') {
    const specs = [
      { gb: 1, days: 7 },
      { gb: 3, days: 15, popular: true },
      { gb: 5, days: 30 },
      { gb: 10, days: 30 },
      { gb: 20, days: 30 },
    ];
    return specs.map((s, i) => ({
      id: `${placeId}-fx-${s.gb}`,
      placeId,
      type: 'fixed' as const,
      gb: s.gb,
      days: s.days,
      usd: round(base + s.gb * (base * 0.55)),
      popular: s.popular,
    }));
  }
  const specs = [
    { days: 3 },
    { days: 7, popular: true },
    { days: 15 },
    { days: 30 },
  ];
  return specs.map((s) => ({
    id: `${placeId}-ul-${s.days}`,
    placeId,
    type: 'unlimited' as const,
    gb: null,
    days: s.days,
    usd: round(base * 1.6 + s.days * (base * 0.22)),
    popular: s.popular,
  }));
}

export type PaymentMethod = { id: 'fib' | 'loyalty'; name: string; desc: string };

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'fib', name: 'FIB', desc: 'First Iraqi Bank' },
  { id: 'loyalty', name: 'Loyalty points', desc: 'Balance: 12,400 pts' },
];
