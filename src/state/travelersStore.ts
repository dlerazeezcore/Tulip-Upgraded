import { create } from 'zustand';
import {
  listTravelers,
  createTraveler,
  updateTraveler,
  deleteTraveler,
  type TravelerInput,
} from '@/services/travelers';
import type { Traveler } from '@/services/types';
import { useAuthStore } from '@/state/authStore';

export type { Traveler };

type TravelersState = {
  travelers: Traveler[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (t: TravelerInput) => Promise<void>;
  update: (id: number, patch: TravelerInput) => Promise<void>;
  remove: (id: number) => Promise<void>;
};

export const useTravelersStore = create<TravelersState>((set, get) => ({
  travelers: [],
  loading: false,
  loaded: false,
  error: null,
  refresh: async () => {
    if (!useAuthStore.getState().isAuthed()) {
      set({ travelers: [], loaded: true, error: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      set({ travelers: await listTravelers(), loaded: true });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load travelers' });
    } finally {
      set({ loading: false });
    }
  },
  add: async (t) => {
    await createTraveler(t);
    await get().refresh();
  },
  update: async (id, patch) => {
    await updateTraveler(id, patch);
    await get().refresh();
  },
  remove: async (id) => {
    await deleteTraveler(id);
    await get().refresh();
  },
}));
