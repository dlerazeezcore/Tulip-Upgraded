import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CurrencyCode } from '@/data/currency';
import { CURRENCIES } from '@/data/currency';
import { getExchangeSettings } from '@/services/esim';

type CurrencyState = {
  code: CurrencyCode;
  hydrated: boolean;
  /** Effective IQD per 1 USD = backend rate × (1 + markup%). */
  iqdPerUsd: number;
  /** True once the live (database) rate has been fetched this session. */
  exchangeLoaded: boolean;
  setCode: (c: CurrencyCode) => void;
  hydrate: () => Promise<void>;
  loadExchange: () => Promise<void>;
};

const KEY = 'tulip.currency';
// Cache the last database-derived effective rate so the app boots with the real
// price instead of the hardcoded bootstrap rate (which has no markup and would
// show bundle prices far below what is actually charged).
const RATE_KEY = 'tulip.iqdPerUsd';

export const useCurrencyStore = create<CurrencyState>((set) => ({
  // Default to IQD: pricing is always shown in Iraqi Dinar.
  code: 'IQD',
  hydrated: false,
  iqdPerUsd: CURRENCIES.IQD.rate,
  exchangeLoaded: false,
  setCode: (code) => {
    set({ code });
    AsyncStorage.setItem(KEY, code).catch(() => {});
  },
  loadExchange: async () => {
    try {
      const s = await getExchangeSettings();
      const rate = parseFloat(s.exchangeRate);
      const markup = parseFloat(s.markupPercent);
      if (Number.isFinite(rate) && rate > 0) {
        const effective = rate * (1 + (Number.isFinite(markup) ? markup : 0) / 100);
        set({ iqdPerUsd: effective, exchangeLoaded: true });
        AsyncStorage.setItem(RATE_KEY, String(effective)).catch(() => {});
      }
    } catch {
      // keep the last-known rate on failure
    }
  },
  hydrate: async () => {
    try {
      const [stored, storedRate] = await Promise.all([
        AsyncStorage.getItem(KEY),
        AsyncStorage.getItem(RATE_KEY),
      ]);
      if (stored === 'USD' || stored === 'EUR' || stored === 'IQD') set({ code: stored });
      const cached = storedRate ? parseFloat(storedRate) : NaN;
      if (Number.isFinite(cached) && cached > 0) set({ iqdPerUsd: cached });
    } catch {}
    set({ hydrated: true });
    // Refresh the live IQD rate from the database in the background.
    void useCurrencyStore.getState().loadExchange();
  },
}));
