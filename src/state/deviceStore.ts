// Device-capability state. Today: just eSIM hardware support.
// Hydrated once at app launch (from app/_layout.tsx) so every screen can read
// the result synchronously without re-running the native check.
//
// The tri-state decision (supported / unsupported / unknown) is made by the pure
// policy in src/lib/esimPolicy.ts from the RAW native signals — see that file for
// why GREEN requires a positive OS signal and the model heuristic never grants it.
import { create } from 'zustand';
import { getEsimSignals } from '@/services/device';
import { classifyEsim, type EsimSupportState } from '@/lib/esimPolicy';

export type { EsimSupportState };

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
      const signals = await getEsimSignals();
      set({ esimSupport: classifyEsim(signals) });
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
