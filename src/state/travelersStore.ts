import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER } from '@/data/user';

export type Traveler = {
  id: string;
  name: string;
  relation: string;
  dob: string;
};

type TravelersState = {
  travelers: Traveler[];
  hydrated: boolean;
  add: (t: Omit<Traveler, 'id'>) => void;
  update: (id: string, patch: Partial<Omit<Traveler, 'id'>>) => void;
  remove: (id: string) => void;
  hydrate: () => Promise<void>;
};

const KEY = 'tulip.travelers';

export const useTravelersStore = create<TravelersState>((set, get) => ({
  travelers: USER.travelers.map((t) => ({ ...t })),
  hydrated: false,
  add: (t) => {
    const next = [...get().travelers, { ...t, id: 'tr_' + Date.now() }];
    set({ travelers: next });
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  },
  update: (id, patch) => {
    const next = get().travelers.map((t) => (t.id === id ? { ...t, ...patch } : t));
    set({ travelers: next });
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  },
  remove: (id) => {
    const next = get().travelers.filter((t) => t.id !== id);
    set({ travelers: next });
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ travelers: JSON.parse(raw) });
    } catch {}
    set({ hydrated: true });
  },
}));
