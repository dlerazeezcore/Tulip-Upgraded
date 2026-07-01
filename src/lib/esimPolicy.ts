// Pure eSIM-compatibility policy. No React Native imports — safe to unit-test in
// isolation. The native module (modules/esim-support) reports RAW signals; this
// file is the single place that decides supported / unsupported / unknown.
//
// Why a policy layer instead of deciding in native code: iOS CoreTelephony can
// return false on genuinely eSIM-capable hardware (the carrier-only
// `cellular-plan-provisioning` entitlement), which historically pushed us to OR
// the API result with an "is this a modern iPhone?" model guess. That guess also
// masked the TRUE negatives we care about — dual-physical-SIM iPhones (mainland
// China / some HK-Macau variants) that share the same model id as eSIM iPhones.
// The rule below fixes that: GREEN requires a positive OS signal; the model guess
// never produces green.

/** Raw signals collected by the native EsimSupport module. */
export type EsimSignals = {
  /** iOS: CTCellularPlanProvisioning positive signal. Android: EuiccManager.isEnabled. */
  apiSupported: boolean;
  /** iOS model-id heuristic (iPhone major >= 11). Diagnostics only — never yields green. */
  modelInfersEsim: boolean;
  /** Simulator / emulator — the OS eSIM API is unreliable here. */
  isSimulator: boolean;
  /** e.g. "iPhone15,2" (iOS) or Build.MODEL (Android). Diagnostics. */
  model: string;
  /** iOS major version / Android SDK_INT. Diagnostics. */
  osMajor: number;
  platform: 'ios' | 'android' | 'web' | 'unknown';
};

export type EsimSupportState = 'supported' | 'unsupported' | 'unknown';

// The single tunable. Default `false` (product decision): when the OS reports no
// eSIM on real hardware we keep the banner NEUTRAL ("please verify") rather than a
// hard red — this removes the false GREEN on dual-SIM iPhones with zero risk of a
// false red on a capable device. Flip to `true` only after on-device testing
// confirms the OS negative is reliable (see the plan's verification matrix); that
// upgrades the real-hardware "no" case to 'unsupported' (red).
export const TRUST_NATIVE_NEGATIVE = false;

/**
 * Decide the eSIM state from raw signals. Pure and total.
 *
 * GREEN ('supported') is only ever returned for a positive OS signal on real
 * hardware — the model heuristic (`modelInfersEsim`) never contributes to it.
 * That single rule is the fix for the dual-SIM false-positive.
 */
export function classifyEsim(
  signals: EsimSignals | null,
  opts: { trustNativeNegative?: boolean } = {},
): EsimSupportState {
  const trustNativeNegative = opts.trustNativeNegative ?? TRUST_NATIVE_NEGATIVE;

  // No native data at all (web / Expo Go / module absent) — we cannot tell.
  if (!signals || signals.platform === 'web') return 'unknown';

  // Simulator / emulator: CoreTelephony reports false for everything here, so
  // neither a true nor a false is meaningful. Never green, never red.
  if (signals.isSimulator) return 'unknown';

  // Positive OS signal → confident green. This is the ONLY path to 'supported'.
  if (signals.apiSupported) return 'supported';

  // Real hardware, OS said "no eSIM". Default: stay neutral (don't trust the
  // negative as a hard fail). When the tunable is on: hard 'unsupported'.
  return trustNativeNegative ? 'unsupported' : 'unknown';
}
