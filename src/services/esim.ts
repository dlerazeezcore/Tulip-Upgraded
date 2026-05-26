// eSIM wiring: catalog, pricing, orders, profiles, install/activate, usage, top-up.
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
