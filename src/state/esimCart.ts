import { create } from 'zustand';
import type { Bundle } from '@/data/esim';

export type CartPlace = {
  id: string;
  name: string;
  iso?: string; // country flag (regions have none)
  isRegion: boolean;
};

type CartState = {
  place: CartPlace | null;
  bundle: Bundle | null;
  select: (place: CartPlace, bundle: Bundle) => void;
  clear: () => void;
};

export const useEsimCart = create<CartState>((set) => ({
  place: null,
  bundle: null,
  select: (place, bundle) => set({ place, bundle }),
  clear: () => set({ place: null, bundle: null }),
}));
