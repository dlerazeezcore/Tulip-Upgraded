import { create } from 'zustand';
import {
  listMyProfiles,
  refreshMyUsage,
  activateMyProfile,
  installMyProfile,
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
  /** Raw used in MB — used for the < 1 GB display ("50 MB used"). */
  usedMb: number;
  remainingGb: number;
  /** Raw remaining in MB — used for the < 1 GB display ("974 MB left"). */
  remainingMb: number;
  daysLeft: number;
  /** Hours-precision time remaining for sub-day accuracy when bundleExpiresAt
   *  is known. Falls back to daysLeft * 24 when unknown. */
  hoursLeft: number;
  iccid: string;
  unlimited?: boolean;
  /** Pre-resolved label for the data plan — use this for display instead of
   *  building "unlimited ? ... : ..." in every render site. */
  dataLabel: EsimDataLabel;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Floor to 1 decimal — used for *remaining* values so we never round 974 MB
 *  up to "1.0 GB" (which makes the bundle look untouched). */
function floor1(n: number): number {
  return Math.floor(n * 10) / 10;
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
 *   2. package name says "unlimited" (and no positive total) → unlimited
 *   3. package name from the order (e.g. "Iraq 0.5 GB · 1d") → show as-is
 *   4. neither → "pending" placeholder
 */
function buildDataLabel(p: EsimProfile): EsimDataLabel {
  const mb = p.totalDataMb;
  if (typeof mb === 'number' && mb > 0) {
    return { kind: 'gb', gb: round1(mb / 1024) };
  }
  const name = (p.packageName ?? '').trim();
  // Positive evidence for unlimited: the purchased package is named so. A
  // missing/zero total alone must NOT imply unlimited (placeholder profiles).
  if (/unlimited/i.test(name)) {
    return { kind: 'unlimited' };
  }
  if (name) {
    return { kind: 'package', name };
  }
  return { kind: 'pending' };
}

function toDisplay(p: EsimProfile): Esim {
  const label = buildDataLabel(p);
  const isUnlimited = label.kind === 'unlimited';
  const usedGb = round1(p.usedDataGb ?? 0);
  // Raw used MB straight from the provider (50 MB), preferring the precise
  // field; only fall back to GB→MB when usedDataMb is absent. This keeps
  // sub-GB usage visible instead of rounding it to "0.0 GB".
  const usedMb = Math.max(
    0,
    Math.floor(p.usedDataMb ?? (p.usedDataGb != null ? p.usedDataGb * 1024 : 0)),
  );
  const planGb = label.kind === 'gb' ? label.gb : 0;
  const rawRemainingMb =
    p.remainingDataMb ??
    (p.remainingDataGb != null ? p.remainingDataGb * 1024 : Math.max(0, (planGb - usedGb) * 1024));
  // Floor instead of round so 974 MB never displays as "1.0 GB left" — that
  // confused users into thinking the bundle was untouched.
  const remainingGb = floor1((rawRemainingMb ?? 0) / 1024);
  // Sub-day precision for the countdown. The backend's `daysLeft` is a
  // ceil(days), which rounds 6 days 14 hours up to 7. Compute hours from
  // bundleExpiresAt (preferred — bundle validity) or expiresAt (fallback),
  // then derive a more accurate days count for display.
  const expiryIso = p.bundleExpiresAt ?? p.expiresAt ?? null;
  let hoursLeft = (p.daysLeft ?? 0) * 24;
  if (expiryIso) {
    const expMs = Date.parse(expiryIso);
    if (Number.isFinite(expMs)) {
      hoursLeft = Math.max(0, Math.floor((expMs - Date.now()) / 3_600_000));
    }
  }
  return {
    id: String(p.id),
    country: p.countryName || p.countryCode || 'eSIM',
    iso: p.countryCode || 'UN',
    planGb,
    // The bundle's total validity (e.g. "7 days"), not the live countdown.
    planDays: p.validityDays ?? p.daysLeft ?? 0,
    status: p.status,
    usedGb,
    usedMb,
    remainingGb,
    remainingMb: Math.max(0, Math.floor(rawRemainingMb ?? 0)),
    daysLeft: p.daysLeft ?? 0,
    hoursLeft,
    iccid: p.iccid || p.esimTranNo || '',
    unlimited: isUnlimited,
    dataLabel: label,
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
  // Terminal-state bundles (cancelled / expired / refunded / revoked).
  // Hidden from the main eSIM list and surfaced via the "History" card.
  history: Esim[];
  historyRaw: Record<string, EsimProfile>;
  historyLoading: boolean;
  refreshing: boolean;
  loaded: boolean;
  error: string | null;
  byId: (id: string) => EsimProfile | undefined;
  refresh: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  activate: (id: string) => Promise<void>;
  install: (id: string) => Promise<void>;
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
  history: [],
  historyRaw: {},
  historyLoading: false,
  refreshing: false,
  loaded: false,
  error: null,

  byId: (id) => get().raw[id] ?? get().historyRaw[id],

  refresh: async () => {
    if (!useAuthStore.getState().isAuthed()) {
      set({ esims: [], raw: {}, history: [], historyRaw: {}, loaded: true, error: null });
      return;
    }
    set({ refreshing: true, error: null });
    try {
      // Main list: backend hides terminal bundles by default. The History
      // screen calls listMyProfiles with status=expired to surface them.
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

  refreshHistory: async () => {
    if (!useAuthStore.getState().isAuthed()) {
      set({ history: [], historyRaw: {} });
      return;
    }
    set({ historyLoading: true });
    try {
      // status=expired captures every terminal lifecycle (cancelled, revoked,
      // refunded, voided, closed, expired) — the backend collapses them all
      // into the "expired" bucket for filtering purposes.
      const res = await listMyProfiles({ limit: 500, status: 'expired' });
      const { esims, raw } = ingest(res.profiles);
      set({ history: esims, historyRaw: raw });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load history' });
    } finally {
      set({ historyLoading: false });
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
}));
