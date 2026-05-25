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
  unlimited?: boolean;
};

export type PurchaseInput = {
  country: string;
  iso: string;
  planGb: number; // ignored when unlimited
  planDays: number;
  unlimited?: boolean;
};

type EsimState = {
  esims: Esim[];
  activate: (id: string) => void;
  topUp: (id: string, gb: number) => void;
  purchase: (input: PurchaseInput) => string;
  reset: () => void;
};

function randomIccid(): string {
  let s = '8964';
  for (let i = 0; i < 12; i++) s += Math.floor(Math.random() * 10);
  return s.replace(/(.{4})/g, '$1 ').trim();
}

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
  purchase: (input) => {
    const id = 'es_' + Date.now();
    const esim: Esim = {
      id,
      country: input.country,
      iso: input.iso,
      planGb: input.unlimited ? 0 : input.planGb,
      planDays: input.planDays,
      status: 'inactive',
      usedGb: 0,
      daysLeft: input.planDays,
      iccid: randomIccid(),
      unlimited: input.unlimited,
    };
    set((s) => ({ esims: [esim, ...s.esims] }));
    return id;
  },
  reset: () => set({ esims: seed.map((e) => ({ ...e })) }),
}));
