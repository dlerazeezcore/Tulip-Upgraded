import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  hydrate: () => Promise<void>;
};

const KEY = 'tulip.theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  hydrated: false,
  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(KEY, mode).catch(() => {});
  },
  toggle: () => {
    const next = get().mode === 'light' ? 'dark' : 'light';
    get().setMode(next);
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(KEY);
      if (stored === 'light' || stored === 'dark') set({ mode: stored });
    } catch {}
    set({ hydrated: true });
  },
}));
