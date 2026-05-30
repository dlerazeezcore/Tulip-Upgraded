// Device-capability state. Today: just eSIM hardware support.
// Hydrated once at app launch (from app/_layout.tsx) so every screen can read
// the result synchronously without re-running the native check.
//
// Three possible states for esimSupport:
//   'supported'    — native check returned true (iOS hardware OR Android EuiccManager)
//   'unsupported'  — native check returned false (definitely no eSIM hardware)
//   'unknown'      — native module not present (web, Expo Go, simulator). UI
//                    must NOT block purchases in this state — we cannot be sure.
import { create } from 'zustand';
import { checkEsimSupport } from '@/services/device';

export type EsimSupportState = 'supported' | 'unsupported' | 'unknown';

type DeviceState = {
  esimSupport: EsimSupportState;
  hydrated: boolean;
  hydrate: () => Promise<void>;
};

export const useDeviceStore = create<DeviceState>((set, get) => ({
  esimSupport: 'unknown',
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const result = await checkEsimSupport();
      let next: EsimSupportState;
      if (result.source === 'native' && result.supported === true) next = 'supported';
      else if (result.source === 'native' && result.supported === false) next = 'unsupported';
      else next = 'unknown';
      set({ esimSupport: next });
    } catch {
      set({ esimSupport: 'unknown' });
    } finally {
      set({ hydrated: true });
    }
  },
}));

/** True only when the OS told us this device has NO eSIM hardware. */
export function isEsimDefinitelyUnsupported(state: EsimSupportState): boolean {
  return state === 'unsupported';
}
