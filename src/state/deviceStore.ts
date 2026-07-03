// Device-capability state. Today: just eSIM hardware support.
// Hydrated once at app launch (from app/_layout.tsx) so every screen can read
// the result synchronously without re-running the native check.
//
// The four-state decision (supported / likely / unsupported / unknown) is made
// by the pure policy in src/lib/esimPolicy.ts from the RAW native signals — read
// that file's header before changing verdict rules (iOS's OS API is
// entitlement-locked; 'likely' is the honest maximum for modern iPhones).
import { create } from 'zustand';
import { getEsimSignals, writeProvenInstalled } from '@/services/device';
import {
  classifyEsimDetail,
  type EsimSignals,
  type EsimSupportState,
  type EsimVerdict,
} from '@/lib/esimPolicy';

export type { EsimSupportState };

type DeviceState = {
  esimSupport: EsimSupportState;
  /** Full verdict (certainty + Android needs-enabling nuance) for the banner. */
  esimVerdict: EsimVerdict;
  /** Raw signals — powers the diagnostics line in the banner's help expander. */
  esimSignals: EsimSignals | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** An eSIM install was just confirmed ON THIS DEVICE (system-install-sheet
   * flow). Persists the proof and flips the state to a certain green. */
  markProvenInstalled: () => Promise<void>;
};

const UNKNOWN_VERDICT: EsimVerdict = { state: 'unknown', certain: false, needsEnabling: false };

export const useDeviceStore = create<DeviceState>((set, get) => ({
  esimSupport: 'unknown',
  esimVerdict: UNKNOWN_VERDICT,
  esimSignals: null,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const signals = await getEsimSignals();
      const verdict = classifyEsimDetail(signals);
      set({ esimSupport: verdict.state, esimVerdict: verdict, esimSignals: signals });
    } catch {
      set({ esimSupport: 'unknown', esimVerdict: UNKNOWN_VERDICT, esimSignals: null });
    } finally {
      set({ hydrated: true });
    }
  },
  markProvenInstalled: async () => {
    await writeProvenInstalled();
    const prior = get().esimSignals;
    const signals: EsimSignals = prior
      ? { ...prior, provenInstalled: true }
      : {
          apiSupported: false,
          hardwareSupported: null,
          provenInstalled: true,
          modelInfersEsim: false,
          isSimulator: false,
          model: '',
          osMajor: 0,
          platform: 'unknown',
        };
    const verdict = classifyEsimDetail(signals);
    set({ esimSupport: verdict.state, esimVerdict: verdict, esimSignals: signals });
  },
}));

/** True only when the OS told us this device has NO eSIM hardware. */
export function isEsimDefinitelyUnsupported(state: EsimSupportState): boolean {
  return state === 'unsupported';
}
