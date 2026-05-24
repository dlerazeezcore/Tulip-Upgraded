import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CurrencyCode } from '@/data/currency';

type CurrencyState = {
  code: CurrencyCode;
  hydrated: boolean;
  setCode: (c: CurrencyCode) => void;
  hydrate: () => Promise<void>;
};

const KEY = 'tulip.currency';

export const useCurrencyStore = create<CurrencyState>((set) => ({
  code: 'USD',
  hydrated: false,
  setCode: (code) => {
    set({ code });
    AsyncStorage.setItem(KEY, code).catch(() => {});
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(KEY);
      if (stored === 'USD' || stored === 'EUR' || stored === 'IQD') set({ code: stored });
    } catch {}
    set({ hydrated: true });
  },
}));
