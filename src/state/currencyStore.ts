import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CurrencyCode, CurrencyMeta } from '@/data/currency';
import { DEFAULT_CURRENCIES } from '@/data/currency';
import { getCurrencies } from '@/services/currency';

const KEY = 'tulip.currency';
const RATE_KEY = 'tulip.iqdPerUsd';
const CURRENCIES_KEY = 'tulip.currencies';

// Approximate markup used only for the very first boot before the live
// `/currencies` feed arrives, so bundle prices aren't shown far below what is
// actually charged. Replaced by the real (service-scoped) eSIM markup on load.
const BOOTSTRAP_MARKUP = 100;
const DEFAULT_USD_RATE = DEFAULT_CURRENCIES.find((c) => c.code === 'USD')!.rate;

function fxFrom(list: CurrencyMeta[]): Record<string, number> {
  const fx: Record<string, number> = { IQD: 1 };
  for (const c of list) if (c?.code) fx[c.code] = c.rate;
  return fx;
}

/** Effective IQD per 1 USD = universal USD→IQD rate × (1 + eSIM markup%). */
function effIqdPerUsd(fx: Record<string, number>, markupPercent: number): number {
  const usd = fx.USD || DEFAULT_USD_RATE;
  const m = Number.isFinite(markupPercent) ? markupPercent : 0;
  return usd * (1 + m / 100);
}

type CurrencyState = {
  code: CurrencyCode;
  hydrated: boolean;
  /** Data-driven list of currencies (incl. enabled flag), from the backend. */
  currencies: CurrencyMeta[];
  /** Universal FX: IQD per 1 unit, keyed by code (IQD = 1). */
  fx: Record<string, number>;
  /** Service-scoped global eSIM markup % (provider cost → IQD sale price). */
  esimMarkup: number;
  /** Effective IQD per 1 USD = fx.USD × (1 + esimMarkup%); drives the IQD sale price. */
  iqdPerUsd: number;
  exchangeLoaded: boolean;
  setCode: (c: CurrencyCode) => void;
  hydrate: () => Promise<void>;
  loadExchange: () => Promise<void>;
};

const DEFAULT_FX = fxFrom(DEFAULT_CURRENCIES);

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  // Default to IQD: the settlement currency.
  code: 'IQD',
  hydrated: false,
  currencies: DEFAULT_CURRENCIES,
  fx: DEFAULT_FX,
  esimMarkup: BOOTSTRAP_MARKUP,
  iqdPerUsd: effIqdPerUsd(DEFAULT_FX, BOOTSTRAP_MARKUP),
  exchangeLoaded: false,
  setCode: (code) => {
    set({ code });
    AsyncStorage.setItem(KEY, code).catch(() => {});
  },
  loadExchange: async () => {
    try {
      const res = await getCurrencies();
      const list = (res.currencies || []).filter((c) => c && c.code);
      if (!list.length) return;
      const markup = Number(res.esimPricing?.markupPercent) || 0;
      const fx = fxFrom(list);
      const iqdPerUsd = effIqdPerUsd(fx, markup);
      // If the selected currency is no longer offered/enabled, fall back to IQD.
      const current = get().code;
      const stillValid = list.some((c) => c.code === current && c.enabled);
      set({
        currencies: list,
        fx,
        esimMarkup: markup,
        iqdPerUsd,
        exchangeLoaded: true,
        ...(stillValid ? {} : { code: 'IQD' as CurrencyCode }),
      });
      AsyncStorage.multiSet([
        [CURRENCIES_KEY, JSON.stringify(list)],
        [RATE_KEY, String(iqdPerUsd)],
      ]).catch(() => {});
    } catch {
      // keep the last-known values on failure
    }
  },
  hydrate: async () => {
    try {
      const [storedCode, storedRate, storedList] = await Promise.all([
        AsyncStorage.getItem(KEY),
        AsyncStorage.getItem(RATE_KEY),
        AsyncStorage.getItem(CURRENCIES_KEY),
      ]);
      let list = DEFAULT_CURRENCIES;
      if (storedList) {
        try {
          const parsed = JSON.parse(storedList);
          if (Array.isArray(parsed) && parsed.length) list = parsed as CurrencyMeta[];
        } catch {}
      }
      const fx = fxFrom(list);
      const cachedRate = storedRate ? parseFloat(storedRate) : NaN;
      const iqdPerUsd =
        Number.isFinite(cachedRate) && cachedRate > 0 ? cachedRate : effIqdPerUsd(fx, get().esimMarkup);
      const code = storedCode && list.some((c) => c.code === storedCode && c.enabled) ? storedCode : get().code;
      set({ currencies: list, fx, iqdPerUsd, code });
    } catch {}
    set({ hydrated: true });
    // Refresh the live universal rates + eSIM markup in the background.
    void get().loadExchange();
  },
}));
