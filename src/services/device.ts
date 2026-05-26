// eSIM hardware-support check. Uses the native `EsimSupport` module when present
// (Expo dev/prebuild client). Degrades gracefully to "unknown" in Expo Go / web,
// where the UI shows a compatibility advisory instead of a hard block.
import { Platform } from 'react-native';

let NativeEsim: { isSupported?: () => Promise<boolean> } | null = null;
try {
  // requireOptionalNativeModule returns null when the native module isn't linked.
  const core = require('expo-modules-core');
  NativeEsim = core?.requireOptionalNativeModule?.('EsimSupport') ?? null;
} catch {
  NativeEsim = null;
}

export type EsimSupportResult = {
  /** true/false from the native check; null when it could not be determined. */
  supported: boolean | null;
  source: 'native' | 'heuristic' | 'unknown';
};

export async function checkEsimSupport(): Promise<EsimSupportResult> {
  if (NativeEsim && typeof NativeEsim.isSupported === 'function') {
    try {
      const supported = await NativeEsim.isSupported();
      return { supported: !!supported, source: 'native' };
    } catch {
      // fall through to heuristic
    }
  }
  if (Platform.OS === 'web') return { supported: null, source: 'unknown' };
  // No native module available: we cannot be certain, so report unknown and let
  // the UI advise the user to confirm their device supports eSIM.
  return { supported: null, source: 'heuristic' };
}

/** True only when we positively know the device cannot use eSIM. */
export function isDefinitelyUnsupported(result: EsimSupportResult): boolean {
  return result.source === 'native' && result.supported === false;
}
