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
  setCode: (c: CurrencyCode) => void;
  hydrate: () => Promise<void>;
  loadExchange: () => Promise<void>;
};

const KEY = 'tulip.currency';

export const useCurrencyStore = create<CurrencyState>((set) => ({
  // Default to IQD: pricing is always shown in Iraqi Dinar.
  code: 'IQD',
  hydrated: false,
  iqdPerUsd: CURRENCIES.IQD.rate,
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
        set({ iqdPerUsd: effective });
      }
    } catch {
      // keep fallback rate on failure
    }
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(KEY);
      if (stored === 'USD' || stored === 'EUR' || stored === 'IQD') set({ code: stored });
    } catch {}
    set({ hydrated: true });
    // Refresh the live IQD rate in the background.
    void useCurrencyStore.getState().loadExchange();
  },
}));
