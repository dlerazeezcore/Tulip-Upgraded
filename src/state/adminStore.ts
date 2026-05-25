import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Demo-only admin flag. Replace with a real role check when the backend lands.
type AdminState = {
  isAdmin: boolean;
  hydrated: boolean;
  setAdmin: (v: boolean) => void;
  hydrate: () => Promise<void>;
};

const KEY = 'tulip.admin';

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: false,
  hydrated: false,
  setAdmin: (isAdmin) => {
    set({ isAdmin });
    AsyncStorage.setItem(KEY, isAdmin ? '1' : '0').catch(() => {});
  },
  hydrate: async () => {
    try {
      const v = await AsyncStorage.getItem(KEY);
      if (v === '1') set({ isAdmin: true });
    } catch {}
    set({ hydrated: true });
  },
}));
