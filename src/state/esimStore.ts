import { create } from 'zustand';
import {
  listMyProfiles,
  refreshMyUsage,
  activateMyProfile,
  findTopUpPackages,
  applyTopUp,
} from '@/services/esim';
import type { EsimProfile } from '@/services/types';
import { useAuthStore } from '@/state/authStore';

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

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function toDisplay(p: EsimProfile): Esim {
  const unlimited = !p.totalDataMb;
  return {
    id: String(p.id),
    country: p.countryName || p.countryCode || 'eSIM',
    iso: p.countryCode || 'UN',
    planGb: unlimited ? 0 : round1(p.totalDataGb ?? 0),
    planDays: p.daysLeft ?? 0,
    status: p.status,
    usedGb: round1(p.usedDataGb ?? 0),
    daysLeft: p.daysLeft ?? 0,
    iccid: p.iccid || p.esimTranNo || '',
    unlimited,
  };
}

function identifierFor(p: EsimProfile): { iccid?: string; esimTranNo?: string; providerOrderNo?: string; id?: number } {
  if (p.iccid) return { iccid: p.iccid };
  if (p.esimTranNo) return { esimTranNo: p.esimTranNo };
  if (p.providerOrderNo) return { providerOrderNo: p.providerOrderNo };
  return { id: typeof p.id === 'number' ? p.id : Number(p.id) };
}

type EsimState = {
  esims: Esim[];
  raw: Record<string, EsimProfile>;
  refreshing: boolean;
  loaded: boolean;
  error: string | null;
  byId: (id: string) => EsimProfile | undefined;
  refresh: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  activate: (id: string) => Promise<void>;
  topUp: (id: string) => Promise<{ ok: boolean; message?: string }>;
};

function ingest(profiles: EsimProfile[]) {
  // Newest first (higher id = more recently created) so a just-bought eSIM
  // appears at the top instead of stale older ones flashing first.
  const sorted = [...profiles].sort((a, b) => Number(b.id) - Number(a.id));
  const raw: Record<string, EsimProfile> = {};
  for (const p of sorted) raw[String(p.id)] = p;
  return { esims: sorted.map(toDisplay), raw };
}

export const useEsimStore = create<EsimState>((set, get) => ({
  esims: [],
  raw: {},
  refreshing: false,
  loaded: false,
  error: null,

  byId: (id) => get().raw[id],

  refresh: async () => {
    if (!useAuthStore.getState().isAuthed()) {
      set({ esims: [], raw: {}, loaded: true, error: null });
      return;
    }
    set({ refreshing: true, error: null });
    try {
      const res = await listMyProfiles({ limit: 200 });
      set({ ...ingest(res.profiles), loaded: true });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load eSIMs' });
    } finally {
      set({ refreshing: false });
    }
  },

  refreshUsage: async () => {
    if (!useAuthStore.getState().isAuthed()) return;
    set({ refreshing: true, error: null });
    try {
      const res = await refreshMyUsage({ limit: 200 });
      set({ ...ingest(res.profiles), loaded: true });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to refresh usage' });
    } finally {
      set({ refreshing: false });
    }
  },

  activate: async (id) => {
    const profile = get().raw[id];
    if (!profile) return;
    await activateMyProfile(identifierFor(profile));
    await get().refresh();
  },

  topUp: async (id) => {
    const profile = get().raw[id];
    if (!profile?.iccid) return { ok: false, message: 'This eSIM has no ICCID yet.' };
    const packages = await findTopUpPackages(profile.iccid);
    if (!packages.length) return { ok: false, message: 'No top-up plans available for this eSIM.' };
    const cheapest = [...packages].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
    await applyTopUp({
      iccid: profile.iccid,
      esimTranNo: profile.esimTranNo ?? undefined,
      packageCode: cheapest.packageCode,
      transactionId: `TOPUP-${Date.now()}`,
    });
    await get().refresh();
    return { ok: true };
  },
}));
