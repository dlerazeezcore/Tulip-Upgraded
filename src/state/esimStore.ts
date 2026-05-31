import { create } from 'zustand';
import {
  listMyProfiles,
  refreshMyUsage,
  activateMyProfile,
  installMyProfile,
  findTopUpPackages,
  applyTopUp,
} from '@/services/esim';
import type { EsimProfile } from '@/services/types';
import { useAuthStore } from '@/state/authStore';

export type EsimStatus = 'inactive' | 'provider_waiting' | 'active' | 'expired';

export type EsimDataLabel =
  | { kind: 'gb'; gb: number }       // "1.0 GB"
  | { kind: 'unlimited' }              // "Unlimited data"
  | { kind: 'package'; name: string }  // fallback to provider's package name
  | { kind: 'pending' };               // we don't know yet

export type Esim = {
  id: string;
  country: string;
  iso: string;
  planGb: number;
  planDays: number;
  status: EsimStatus;
  usedGb: number;
  remainingGb: number;
  daysLeft: number;
  iccid: string;
  unlimited?: boolean;
  /** Pre-resolved label for the data plan — use this for display instead of
   *  building "unlimited ? ... : ..." in every render site. */
  dataLabel: EsimDataLabel;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Decide what to show for the data plan.
 *
 * IMPORTANT: "Unlimited" is positive-evidence-only. The previous logic
 * (`unlimited = !p.totalDataMb`) treated any missing data as unlimited, which
 * made every placeholder profile (the broken ones the provider hasn't yet
 * populated) wrongly display as "Unlimited data". That misled users into
 * thinking they had bought a different plan than they did.
 *
 * Priority:
 *   1. positive totalDataMb > 0  → show the GB amount
 *   2. package name from the order (e.g. "Iraq 0.5 GB · 1d") → show as-is
 *   3. neither → "pending" placeholder
 */
function buildDataLabel(p: EsimProfile): EsimDataLabel {
  const mb = p.totalDataMb;
  if (typeof mb === 'number' && mb > 0) {
    return { kind: 'gb', gb: round1(mb / 1024) };
  }
  if (p.packageName && p.packageName.trim()) {
    return { kind: 'package', name: p.packageName.trim() };
  }
  return { kind: 'pending' };
}

function toDisplay(p: EsimProfile): Esim {
  const label = buildDataLabel(p);
  const isUnlimited = label.kind === 'unlimited';
  const usedGb = round1(p.usedDataGb ?? 0);
  const planGb = label.kind === 'gb' ? label.gb : 0;
  const remainingGb = round1(
    p.remainingDataGb ??
    (p.remainingDataMb != null ? p.remainingDataMb / 1024 : Math.max(0, planGb - usedGb))
  );
  return {
    id: String(p.id),
    country: p.countryName || p.countryCode || 'eSIM',
    iso: p.countryCode || 'UN',
    planGb,
    // The bundle's total validity (e.g. "7 days"), not the live countdown.
    planDays: p.validityDays ?? p.daysLeft ?? 0,
    status: p.status,
    usedGb,
    remainingGb,
    daysLeft: p.daysLeft ?? 0,
    iccid: p.iccid || p.esimTranNo || '',
    unlimited: isUnlimited,
    dataLabel: label,
  };
}

/** Convenience: turn an EsimDataLabel into the user-visible string. */
export function formatEsimDataLabel(label: EsimDataLabel): string {
  switch (label.kind) {
    case 'gb':        return `${label.gb} GB`;
    case 'unlimited': return 'Unlimited data';
    case 'package':   return label.name;
    case 'pending':   return 'Plan details loading…';
  }
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
  install: (id: string) => Promise<void>;
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

  // Record in the database that the user has installed this eSIM.
  install: async (id) => {
    const profile = get().raw[id];
    if (!profile) return;
    await installMyProfile(identifierFor(profile));
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
