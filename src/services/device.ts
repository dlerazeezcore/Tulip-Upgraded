// eSIM hardware-support check. Uses the native `EsimSupport` module when present
// (Expo dev/prebuild client). Degrades gracefully to "unknown" in Expo Go / web,
// where the UI shows a compatibility advisory instead of a hard block.
//
// The native module reports RAW signals; the four-state decision lives in the
// pure policy at src/lib/esimPolicy.ts — read its header before changing HOW a
// verdict is reached (the iOS OS API is entitlement-locked; China dual-SIM
// variants are indistinguishable by model id).
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Set once an eSIM install is confirmed to have happened ON THIS DEVICE through
// our app (the system-install-sheet flow — NOT the share-QR / manual paths,
// which may target someone else's phone). Once true, the device is empirically
// eSIM-capable forever; the policy turns this into a certain green.
const PROVEN_INSTALL_KEY = 'esim.provenInstalledOnDevice';

export async function readProvenInstalled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PROVEN_INSTALL_KEY)) === 'true';
  } catch {
    return false;
  }
}

/** Persist the proven-install fact. State updates live in useDeviceStore
 * (markProvenInstalled), which calls this — keeps the import graph acyclic. */
export async function writeProvenInstalled(): Promise<void> {
  try {
    await AsyncStorage.setItem(PROVEN_INSTALL_KEY, 'true');
  } catch {
    // Non-fatal: the flag re-arms on the next confirmed install.
  }
}

function normalizeSignals(s: Partial<EsimSignals>, provenInstalled: boolean): EsimSignals {
  const platform: EsimSignals['platform'] =
    s.platform === 'ios' || s.platform === 'android' || s.platform === 'web'
      ? s.platform
      : ((Platform.OS as EsimSignals['platform']) ?? 'unknown');
  return {
    apiSupported: !!s.apiSupported,
    // Tri-state on purpose: absent (older native binary / iOS) must stay null —
    // fabricating false here would produce a wrong certain-red on Android.
    hardwareSupported: typeof s.hardwareSupported === 'boolean' ? s.hardwareSupported : null,
    provenInstalled,
    modelInfersEsim: !!s.modelInfersEsim,
    isSimulator: !!s.isSimulator,
    model: typeof s.model === 'string' ? s.model : '',
    osMajor: typeof s.osMajor === 'number' ? s.osMajor : 0,
    platform,
  };
}

/**
 * Fetch RAW eSIM signals (native module + persisted proven-install flag).
 * Returns null when no native module is present (web / Expo Go), which the
 * policy maps to 'unknown'.
 */
export async function getEsimSignals(): Promise<EsimSignals | null> {
  const provenInstalled = await readProvenInstalled();
  if (NativeEsim && typeof NativeEsim.getSignals === 'function') {
    try {
      return normalizeSignals(await NativeEsim.getSignals(), provenInstalled);
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
          hardwareSupported: null,
          provenInstalled,
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
  // No native module — but a proven install still outranks "no signal".
  if (provenInstalled) {
    return {
      apiSupported: false,
      hardwareSupported: null,
      provenInstalled: true,
      modelInfersEsim: false,
      isSimulator: false,
      model: '',
      osMajor: 0,
      platform: (Platform.OS as EsimSignals['platform']) ?? 'unknown',
    };
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
 * 'likely' maps to the non-committal shape (soft advisory, never a hard claim).
 */
export async function checkEsimSupport(): Promise<EsimSupportResult> {
  const signals = await getEsimSignals();
  const state: EsimSupportState = classifyEsim(signals);
  if (state === 'supported') return { supported: true, source: 'native' };
  if (state === 'unsupported') return { supported: false, source: 'native' };
  // 'likely' / 'unknown' — no committal claim. Preserve the previous shape so
  // the detail screen shows its soft advisory rather than a hard "unsupported".
  if (!signals) return { supported: null, source: Platform.OS === 'web' ? 'unknown' : 'heuristic' };
  return { supported: null, source: 'native' };
}

/** True only when we positively know the device cannot use eSIM. */
export function isDefinitelyUnsupported(result: EsimSupportResult): boolean {
  return result.source === 'native' && result.supported === false;
}
