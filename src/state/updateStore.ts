// In-app "update available" detection.
//
// On launch and on AppState transition to active, the app calls GET /api/v1/app/version-info,
// compares the server-side `latestVersion` and `minSupportedVersion` to the running
// app's native version (`Constants.expoConfig.version` / `Application.nativeApplicationVersion`),
// and surfaces a status:
//   - 'idle'   — up to date, no modal
//   - 'forced' — behind `latestVersion`; non-dismissible modal (user MUST update)
//
// Product decision (2026-07-02): ANY available update is mandatory — the app is
// blocked until the user updates. The admin publishes `latestVersion` from the
// admin panel's update screen. The 'optional' tier and its dismissal machinery
// are kept in the types as the one-line revert path but are never derived.
//
// The UI component reads this store and renders the modal. The wiring hook
// (useUpdateAvailableModal) projects this into ready-to-render props.

import { create } from 'zustand';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { apiFetch } from '@/lib/api';
import type { AppVersionInfo } from '@/services/types';

export type UpdateStatus = 'idle' | 'optional' | 'forced';

type UpdateState = {
  status: UpdateStatus;
  info: AppVersionInfo | null;
  current: string;
  checking: boolean;
  dismissed: boolean; // user tapped "Later" on an optional prompt this session
  checkForUpdate: () => Promise<void>;
  dismiss: () => void;
};

function currentVersion(): string {
  const v = Constants.expoConfig?.version || Application.nativeApplicationVersion || '0.0.0';
  return String(v).trim() || '0.0.0';
}

/** Compare two dotted-numeric version strings. Returns -1, 0, or 1. */
export function compareVersions(a: string, b: string): number {
  const pa = String(a || '0').split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(b || '0').split('.').map((x) => parseInt(x, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

function deriveStatus(current: string, info: AppVersionInfo): UpdateStatus {
  if (compareVersions(current, info.minSupportedVersion) < 0) return 'forced';
  // Every update is mandatory: being behind latest blocks the app.
  if (compareVersions(current, info.latestVersion) < 0) return 'forced';
  return 'idle';
}

export function platformStoreUrl(info: AppVersionInfo | null): string | null {
  if (!info) return null;
  if (Platform.OS === 'ios') return info.appStoreUrl || null;
  if (Platform.OS === 'android') return info.playStoreUrl || null;
  return info.playStoreUrl || info.appStoreUrl || null;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  status: 'idle',
  info: null,
  current: currentVersion(),
  checking: false,
  dismissed: false,

  checkForUpdate: async () => {
    if (Platform.OS === 'web') return; // no in-app update flow on web
    if (get().checking) return;
    set({ checking: true });
    try {
      const info = await apiFetch<AppVersionInfo>('/api/v1/app/version-info', {
        method: 'GET',
        auth: false,
      });
      const current = currentVersion();
      const status = deriveStatus(current, info);
      // Forced clears any prior dismissal (user can no longer bypass).
      const dismissed = status === 'forced' ? false : get().dismissed;
      set({ info, current, status, dismissed });
    } catch {
      // network/server error → leave previous state untouched
    } finally {
      set({ checking: false });
    }
  },

  dismiss: () => {
    if (get().status === 'forced') return; // not dismissible
    set({ dismissed: true });
  },
}));
