// eSIM hardware-support check. Uses the native `EsimSupport` module when present
// (Expo dev/prebuild client). Degrades gracefully to "unknown" in Expo Go / web,
// where the UI shows a compatibility advisory instead of a hard block.
//
// The native module reports RAW signals; the tri-state decision lives in the pure
// policy at src/lib/esimPolicy.ts (GREEN requires a positive OS signal — the model
// heuristic never grants it, which fixes the dual-SIM false-positive).
import { Platform } from 'react-native';
import { classifyEsim, type EsimSignals, type EsimSupportState } from '@/lib/esimPolicy';

type NativeEsimModule = {
  isSupported?: () => Promise<boolean>;
  getSignals?: () => Promise<Partial<EsimSignals>>;
};

let NativeEsim: NativeEsimModule | null = null;
try {
  // requireOptionalNativeModule returns null when the native module isn't linked.
  const core = require('expo-modules-core');
  NativeEsim = core?.requireOptionalNativeModule?.('EsimSupport') ?? null;
} catch {
  NativeEsim = null;
}

function normalizeSignals(s: Partial<EsimSignals>): EsimSignals {
  const platform: EsimSignals['platform'] =
    s.platform === 'ios' || s.platform === 'android' || s.platform === 'web'
      ? s.platform
      : ((Platform.OS as EsimSignals['platform']) ?? 'unknown');
  return {
    apiSupported: !!s.apiSupported,
    modelInfersEsim: !!s.modelInfersEsim,
    isSimulator: !!s.isSimulator,
    model: typeof s.model === 'string' ? s.model : '',
    osMajor: typeof s.osMajor === 'number' ? s.osMajor : 0,
    platform,
  };
}

/**
 * Fetch RAW eSIM signals from the native module. Returns null when no native
 * module is present (web / Expo Go), which the policy maps to 'unknown'.
 */
export async function getEsimSignals(): Promise<EsimSignals | null> {
  if (NativeEsim && typeof NativeEsim.getSignals === 'function') {
    try {
      return normalizeSignals(await NativeEsim.getSignals());
    } catch {
      // fall through
    }
  }
  // Back-compat: a native binary that only exposes the legacy isSupported(). A
  // legacy `true` is a trustworthy positive; a legacy `false` is ambiguous (it
  // already OR-ed the model heuristic) so we cannot mine a real negative from it
  // — treat non-true as "no native signal".
  if (NativeEsim && typeof NativeEsim.isSupported === 'function') {
    try {
      if (await NativeEsim.isSupported()) {
        return {
          apiSupported: true,
          modelInfersEsim: false,
          isSimulator: false,
          model: '',
          osMajor: 0,
          platform: (Platform.OS as EsimSignals['platform']) ?? 'unknown',
        };
      }
    } catch {
      // fall through
    }
  }
  return null;
}

export type EsimSupportResult = {
  /** true/false from the native check; null when it could not be determined. */
  supported: boolean | null;
  source: 'native' | 'heuristic' | 'unknown';
};

/**
 * Legacy shape kept for the eSIM detail screen (useEsimDetail.ts / app/esim/[id]).
 * Derived from the same policy as the store so both stay consistent.
 */
export async function checkEsimSupport(): Promise<EsimSupportResult> {
  const signals = await getEsimSignals();
  const state: EsimSupportState = classifyEsim(signals);
  if (state === 'supported') return { supported: true, source: 'native' };
  if (state === 'unsupported') return { supported: false, source: 'native' };
  // 'unknown' — no committal signal. Preserve the previous shape so the detail
  // screen shows its soft advisory rather than a hard "unsupported".
  if (!signals) return { supported: null, source: Platform.OS === 'web' ? 'unknown' : 'heuristic' };
  return { supported: null, source: 'native' };
}

/** True only when we positively know the device cannot use eSIM. */
export function isDefinitelyUnsupported(result: EsimSupportResult): boolean {
  return result.source === 'native' && result.supported === false;
}
