// Universal currency feed: pure FX rates (IQD per 1 unit) for every enabled
// display currency + the eSIM markup (service-scoped) the client uses to compute
// eSIM sale prices. Public + cached on the backend.
import { apiFetch } from '@/lib/api';
import type { CurrencyMeta } from '@/data/currency';

export type CurrenciesResponse = {
  baseCurrency: string;
  currencies: CurrencyMeta[];
  esimPricing: { markupPercent: number };
};

export async function getCurrencies(): Promise<CurrenciesResponse> {
  return apiFetch<CurrenciesResponse>('/api/v1/currencies', { method: 'GET', auth: false });
}
