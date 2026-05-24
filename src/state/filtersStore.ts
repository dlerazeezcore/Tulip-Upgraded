import { create } from 'zustand';

type FiltersState = {
  hotelStars: Record<number, boolean>;
  hotelAmenities: { wifi: boolean; pool: boolean; gym: boolean; breakfast: boolean };
  flightSort: 'recommended' | 'price' | 'duration';
  toggleStar: (n: number) => void;
  toggleAmenity: (k: keyof FiltersState['hotelAmenities']) => void;
  setFlightSort: (s: FiltersState['flightSort']) => void;
  reset: () => void;
};

export const useFiltersStore = create<FiltersState>((set) => ({
  hotelStars: { 5: true, 4: false, 3: false },
  hotelAmenities: { wifi: true, pool: true, gym: false, breakfast: false },
  flightSort: 'recommended',
  toggleStar: (n) => set((s) => ({ hotelStars: { ...s.hotelStars, [n]: !s.hotelStars[n] } })),
  toggleAmenity: (k) =>
    set((s) => ({ hotelAmenities: { ...s.hotelAmenities, [k]: !s.hotelAmenities[k] } })),
  setFlightSort: (flightSort) => set({ flightSort }),
  reset: () =>
    set({
      hotelStars: { 5: true, 4: false, 3: false },
      hotelAmenities: { wifi: true, pool: true, gym: false, breakfast: false },
      flightSort: 'recommended',
    }),
}));
