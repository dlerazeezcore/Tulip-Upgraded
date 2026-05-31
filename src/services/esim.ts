// eSIM wiring: catalog, pricing, orders, profiles, install/activate, usage, top-up.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, unwrap } from '@/lib/api';
import type {
  EsimProfile,
  ExchangeSettings,
  FeaturedLocation,
  ManagedOrderResult,
  OrderSummary,
  ProfileListResult,
  ProviderPackage,
} from './types';

const BASE = '/api/v1/esim-access';

export async function queryPackages(params: {
  locationCode?: string;
  type?: string;
  packageCode?: string;
  iccid?: string;
}): Promise<ProviderPackage[]> {
  const res: any = await apiFetch(`${BASE}/packages/query`, {
    method: 'POST',
    auth: false,
    body: params,
  });
  return (res?.obj?.packageList ?? []) as ProviderPackage[];
}

export type LocationCountry = { code: string; name: string };

// In-memory cache so full country names are available synchronously after the
// first load (eliminates the "2-letter code then full name" flash). Persisted
// to AsyncStorage so it survives app restarts and is warm on the next launch.
const COUNTRIES_KEY = 'tulip.countries';
let countriesCache: LocationCountry[] = [];
AsyncStorage.getItem(COUNTRIES_KEY)
  .then((raw) => {
    if (raw && countriesCache.length === 0) {
      try { countriesCache = JSON.parse(raw); } catch {}
    }
  })
  .catch(() => {});

/** Synchronously read the cached country list (may be empty before first load). */
export function cachedCountries(): LocationCountry[] {
  return countriesCache;
}

/** All provider countries (ISO-2, type=country), for the searchable catalog list. */
export async function getCountries(): Promise<LocationCountry[]> {
  const res: any = await apiFetch(`${BASE}/locations/query`, { method: 'POST', auth: false, body: {} });
  const list = (res?.obj?.locationList ?? []) as any[];
  const seen = new Set<string>();
  const out: LocationCountry[] = [];
  for (const l of list) {
    const code = String(l?.code ?? '').toUpperCase();
    if (l?.type !== 1 || !/^[A-Z]{2}$/.test(code) || seen.has(code)) continue;
    seen.add(code);
    out.push({ code, name: String(l?.name ?? code) });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  if (out.length) {
    countriesCache = out;
    AsyncStorage.setItem(COUNTRIES_KEY, JSON.stringify(out)).catch(() => {});
  }
  return out;
}

export type ProviderRegion = { code: string; name: string };

/** Provider regions (type=2), e.g. EU-42 "Europe (40+ areas)". Used for the Regions tab. */
export async function getRegions(): Promise<ProviderRegion[]> {
  const res: any = await apiFetch(`${BASE}/locations/query`, { method: 'POST', auth: false, body: {} });
  const list = (res?.obj?.locationList ?? []) as any[];
  const out: ProviderRegion[] = [];
  const seen = new Set<string>();
  for (const l of list) {
    const code = String(l?.code ?? '').toUpperCase();
    if (l?.type !== 2 || !code || seen.has(code)) continue;
    seen.add(code);
    out.push({ code, name: String(l?.name ?? code) });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export async function getExchangeSettings(): Promise<ExchangeSettings> {
  const res = await apiFetch(`${BASE}/exchange-rates/current`, { method: 'GET', auth: false });
  return unwrap<ExchangeSettings>(res);
}

export async function getFeaturedLocations(serviceType = 'esim'): Promise<FeaturedLocation[]> {
  const res: any = await apiFetch('/api/v1/featured-locations/public', {
    method: 'GET',
    auth: false,
    query: { serviceType },
  });
  return (res?.data?.locations ?? res?.locations ?? []) as FeaturedLocation[];
}

export async function listMyProfiles(params: {
  status?: 'inactive' | 'active' | 'expired';
  installed?: boolean;
  limit?: number;
  offset?: number;
  userId?: string;
} = {}): Promise<ProfileListResult> {
  const res = await apiFetch(`${BASE}/profiles/my`, { method: 'GET', query: params });
  return unwrap<ProfileListResult>(res);
}

export async function refreshMyUsage(params: {
  status?: 'inactive' | 'active' | 'expired';
  installed?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<ProfileListResult> {
  const res = await apiFetch(`${BASE}/usage/sync/my`, { method: 'POST', query: params });
  return unwrap<ProfileListResult>(res);
}

type ProfileIdentifier = {
  providerOrderNo?: string;
  iccid?: string;
  esimTranNo?: string;
  id?: number;
};

export async function activateMyProfile(
  ident: ProfileIdentifier,
  opts: { platformCode?: string; note?: string } = {},
): Promise<EsimProfile> {
  const res = await apiFetch(`${BASE}/profiles/activate/my`, {
    method: 'POST',
    body: { ...ident, platformCode: opts.platformCode ?? 'tulip-mobile-app', note: opts.note },
  });
  return unwrap<{ profile: EsimProfile }>(res).profile;
}

export async function installMyProfile(
  ident: ProfileIdentifier,
  opts: { platformCode?: string; note?: string } = {},
): Promise<EsimProfile> {
  const res = await apiFetch(`${BASE}/profiles/install/my`, {
    method: 'POST',
    body: { ...ident, platformCode: opts.platformCode ?? 'tulip-mobile-app', note: opts.note },
  });
  return unwrap<{ profile: EsimProfile }>(res).profile;
}

export type ManagedOrderInput = {
  transactionId: string;
  packageCode: string;
  count?: number;
  periodNum?: number;
  providerPriceMinor: number; // raw provider price (server recomputes the IQD total)
  user: { phone: string; name: string; email?: string | null };
  countryCode?: string;
  countryName?: string;
  packageName?: string;
  packageSlug?: string;
  currencyCode?: string; // default IQD
  providerCurrencyCode?: string; // default USD
  paymentMethod: 'loyalty' | 'fib';
  paymentProvider?: string;
  paymentStatus?: string;
  paymentTransactionId?: string;
  salePriceMinor?: number; // display-only; server is authoritative
  customFields?: Record<string, any>;
};

export function createManagedOrder(input: ManagedOrderInput): Promise<ManagedOrderResult> {
  return apiFetch<ManagedOrderResult>(`${BASE}/orders/managed`, {
    method: 'POST',
    body: {
      providerRequest: {
        transactionId: input.transactionId,
        packageInfoList: [
          {
            packageCode: input.packageCode,
            count: input.count ?? 1,
            price: input.providerPriceMinor,
            periodNum: input.periodNum,
          },
        ],
      },
      user: input.user,
      platformCode: 'tulip-mobile-app',
      platformName: 'Tulip Mobile App',
      currencyCode: input.currencyCode ?? 'IQD',
      providerCurrencyCode: input.providerCurrencyCode ?? 'USD',
      providerPriceMinor: input.providerPriceMinor,
      salePriceMinor: input.salePriceMinor,
      countryCode: input.countryCode,
      countryName: input.countryName,
      packageCode: input.packageCode,
      packageName: input.packageName,
      packageSlug: input.packageSlug,
      paymentMethod: input.paymentMethod,
      paymentProvider: input.paymentProvider ?? input.paymentMethod,
      paymentStatus: input.paymentStatus,
      paymentTransactionId: input.paymentTransactionId,
      customFields: input.customFields ?? {},
    },
  });
}

export async function getMyOrders(params: { limit?: number; offset?: number } = {}): Promise<OrderSummary[]> {
  const res = await apiFetch(`${BASE}/orders/my`, { method: 'GET', query: params });
  return unwrap<{ orders: OrderSummary[] }>(res).orders;
}

/**
 * User-facing per-profile recover. Calls the provider's query_profiles for
 * this one profile and writes the result back to our DB. The detail screen
 * polls this after checkout so activation_code lands the moment the provider
 * materializes it — no waiting for the 30-min cron.
 */
export async function recoverProfile(profileId: number | string): Promise<{
  ok: boolean;
  hasActivationCode: boolean;
  hasIccid: boolean;
  appStatus: string | null;
}> {
  return apiFetch(`/api/v1/esim-access/profiles/${profileId}/recover`, {
    method: 'POST',
  });
}

export function findTopUpPackages(iccid: string): Promise<ProviderPackage[]> {
  return queryPackages({ type: 'TOPUP', iccid });
}

export function applyTopUp(input: {
  iccid: string;
  esimTranNo?: string;
  packageCode: string;
  transactionId: string;
}): Promise<any> {
  return apiFetch(`${BASE}/topups/managed`, {
    method: 'POST',
    body: {
      providerRequest: {
        iccid: input.iccid,
        esimTranNo: input.esimTranNo,
        packageCode: input.packageCode,
        transactionId: input.transactionId,
      },
      platformCode: 'tulip-mobile-app',
      platformName: 'Tulip Mobile App',
      syncAfterTopup: true,
    },
  });
}
