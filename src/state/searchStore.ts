import { create } from 'zustand';
import type { Service } from '@/data/services';

type TripType = 'oneway' | 'roundtrip';

type SearchState = {
  activeService: Service['id'];
  from: string;
  to: string;
  departDate: string;
  returnDate: string;
  travelers: number;
  rooms: number;
  tripType: TripType;
  setActive: (id: Service['id']) => void;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  setDepart: (v: string) => void;
  setReturn: (v: string) => void;
  setTravelers: (n: number) => void;
  setRooms: (n: number) => void;
  setTripType: (t: TripType) => void;
  swap: () => void;
};

export const useSearchStore = create<SearchState>((set, get) => ({
  activeService: 'flights',
  from: 'JFK · New York',
  to: 'LHR · London',
  departDate: 'Jun 9',
  returnDate: 'Jun 22',
  travelers: 2,
  rooms: 1,
  tripType: 'roundtrip',
  setActive: (activeService) => set({ activeService }),
  setFrom: (from) => set({ from }),
  setTo: (to) => set({ to }),
  setDepart: (departDate) => set({ departDate }),
  setReturn: (returnDate) => set({ returnDate }),
  setTravelers: (travelers) => set({ travelers: Math.max(1, Math.min(9, travelers)) }),
  setRooms: (rooms) => set({ rooms: Math.max(1, Math.min(8, rooms)) }),
  setTripType: (tripType) => set({ tripType }),
  swap: () => set({ from: get().to, to: get().from }),
}));
