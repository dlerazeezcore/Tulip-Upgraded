import { create } from 'zustand';

export type EsimStatus = 'inactive' | 'active' | 'expired';

export type Esim = {
  id: string;
  country: string;
  iso: string;
  planGb: number;
  planDays: number;
  status: EsimStatus;
  usedGb: number;
  daysLeft: number;
  iccid: string;
};

type EsimState = {
  esims: Esim[];
  activate: (id: string) => void;
  topUp: (id: string, gb: number) => void;
  reset: () => void;
};

const seed: Esim[] = [
  {
    id: 'jp-1',
    country: 'Japan',
    iso: 'JP',
    planGb: 5,
    planDays: 30,
    status: 'active',
    usedGb: 2.3,
    daysLeft: 8,
    iccid: '8981 1900 0000 1234',
  },
  {
    id: 'uk-1',
    country: 'United Kingdom',
    iso: 'GB',
    planGb: 5,
    planDays: 14,
    status: 'inactive',
    usedGb: 0,
    daysLeft: 14,
    iccid: '8944 1100 0000 5678',
  },
  {
    id: 'fr-1',
    country: 'France',
    iso: 'FR',
    planGb: 3,
    planDays: 15,
    status: 'expired',
    usedGb: 3,
    daysLeft: 0,
    iccid: '8933 1100 0000 9012',
  },
];

export const useEsimStore = create<EsimState>((set) => ({
  esims: seed.map((e) => ({ ...e })),
  activate: (id) =>
    set((s) => ({
      esims: s.esims.map((e) =>
        e.id === id && e.status === 'inactive'
          ? { ...e, status: 'active', daysLeft: e.planDays, usedGb: 0 }
          : e,
      ),
    })),
  topUp: (id, gb) =>
    set((s) => ({
      esims: s.esims.map((e) =>
        e.id === id ? { ...e, planGb: e.planGb + gb, status: 'active' } : e,
      ),
    })),
  reset: () => set({ esims: seed.map((e) => ({ ...e })) }),
}));
