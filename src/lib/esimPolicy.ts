// Pure eSIM-compatibility policy. No React Native imports — safe to unit-test in
// isolation. The native module (modules/esim-support) reports RAW signals; this
// file is the single place that decides supported / likely / unsupported / unknown.
//
// ─── READ THIS BEFORE "FIXING" THE POLICY ────────────────────────────────────
// iOS ground truth is entitlement-locked. CTCellularPlanProvisioning's
// supportsCellularPlan() / supportsEmbeddedSIM are gated behind the carrier-only
// `cellular-plan-provisioning` entitlement; on a normal App Store build they
// return FALSE even on eSIM-capable iPhones (verified on device — see commits
// b1b7a69 and 9a5ee15 for the history of relearning this). And mainland-China
// (plus some HK/Macau) dual-physical-SIM iPhones share the exact same model
// identifier as global eSIM units (iPhone 11 and newer), while every signal
// that could tell them apart (SIM slot count, EID, regulatory A-number,
// carrier info) is private API or was privacy-removed in iOS 16.
//
// Consequences, and the contract of this file:
//   • 'supported'   is only produced by CERTAIN evidence: an OS positive, a
//     proven eSIM install on THIS device through our app, or (Android) the
//     OEM-declared eUICC hardware feature.
//   • 'unsupported' is only produced by CERTAIN evidence: iPhone X/8/7-era
//     hardware (predates eSIM), or Android explicitly lacking the eUICC
//     feature (or predating it, SDK < 28).
//   • 'likely'      is the honest middle for modern iPhones where the OS
//     positive cannot fire without the entitlement: "this model supports eSIM
//     unless it is a mainland-China dual-physical-SIM variant" — a statement
//     that is TRUE for every device that sees it. Do NOT collapse this into
//     'supported' (false green on China variants) or 'unknown' (tells the 95%+
//     majority nothing). If Apple ever grants the carrier entitlement, the OS
//     positive starts firing and 'likely' disappears by itself.
//   • 'unknown'     is reserved for genuinely no-evidence contexts: web,
//     Expo Go (no native module), simulators/emulators, iPads.
// ─────────────────────────────────────────────────────────────────────────────

/** Raw signals collected by the native EsimSupport module (+ JS-side proof). */
export type EsimSignals = {
  /** iOS: CTCellularPlanProvisioning positive signal (entitlement-gated — false
   * is NOT evidence of anything). Android: EuiccManager.isEnabled. */
  apiSupported: boolean;
  /** Android only: PackageManager.hasSystemFeature(FEATURE_TELEPHONY_EUICC).
   * true/false is OEM-declared hardware truth; null = signal unavailable
   * (older native binary, SDK < 28, or iOS where no equivalent exists). */
  hardwareSupported: boolean | null;
  /** An eSIM was successfully installed on THIS device through our app
   * (persisted locally at install-confirmation time). Strongest iOS positive. */
  provenInstalled: boolean;
  /** iOS model-id heuristic (iPhone major >= 11). Kept for diagnostics parity
   * with the native module; classify() derives its own verdict from `model`. */
  modelInfersEsim: boolean;
  /** Simulator / emulator — the OS eSIM API is unreliable here. */
  isSimulator: boolean;
  /** e.g. "iPhone15,2" (iOS) or Build.MODEL (Android). */
  model: string;
  /** iOS major version / Android SDK_INT. Diagnostics. */
  osMajor: number;
  platform: 'ios' | 'android' | 'web' | 'unknown';
};

export type EsimSupportState = 'supported' | 'likely' | 'unsupported' | 'unknown';

export type EsimVerdict = {
  state: EsimSupportState;
  /** true when 'supported' came from certain evidence (OS positive, proven
   * install, or Android hardware flag) — the banner hides "How to check" only
   * then. Android's hardware-yes-but-disabled case sets this true but ALSO
   * sets `needsEnabling`, which keeps the help affordance visible. */
  certain: boolean;
  /** Android: eUICC hardware present but currently disabled — surface the
   * "enable eSIM in Settings" nuance next to the green. */
  needsEnabling: boolean;
};

/** Parse the major number out of an iPhone hardware identifier.
 * "iPhone15,2" → 15 · "iPad13,1" / "arm64" / "" → null. */
export function parseIphoneMajor(model: string): number | null {
  if (!model.startsWith('iPhone')) return null;
  const digits = /^iPhone(\d+),/.exec(model);
  if (!digits) return null;
  const major = Number(digits[1]);
  return Number.isFinite(major) ? major : null;
}

/**
 * Decide the eSIM verdict from raw signals. Pure and total — every branch below
 * maps to a row of the decision tables in the fix plan, in certainty order.
 */
export function classifyEsimDetail(signals: EsimSignals | null): EsimVerdict {
  const no = { certain: false, needsEnabling: false };

  // No native data at all (web / Expo Go / module absent) — we cannot tell.
  if (!signals || signals.platform === 'web') return { state: 'unknown', ...no };

  // Proven: an eSIM was installed on this exact device through our app.
  // Checked before the simulator guard deliberately — empirical proof beats
  // environment heuristics (and can never be set on web, which lacks the flow).
  if (signals.provenInstalled) return { state: 'supported', certain: true, needsEnabling: false };

  // Simulator / emulator: the OS API reports false for everything here, so
  // neither a true nor a false is meaningful. Never green, never red.
  if (signals.isSimulator) return { state: 'unknown', ...no };

  if (signals.platform === 'android') {
    // eUICC live and enabled — certain green. Checked FIRST: a working eSIM is
    // stronger evidence than any declaration (an OEM ROM that forgot the
    // feature flag must not turn a functioning device red).
    if (signals.apiSupported) return { state: 'supported', certain: true, needsEnabling: false };
    // Hardware-declared absence (or an OS too old for eSIM at all) — certain red.
    if (signals.hardwareSupported === false || (signals.osMajor > 0 && signals.osMajor < 28)) {
      return { state: 'unsupported', certain: true, needsEnabling: false };
    }
    // Hardware present but eUICC disabled/not set up — green with a nuance.
    if (signals.hardwareSupported === true) {
      return { state: 'supported', certain: true, needsEnabling: true };
    }
    // Old native binary: no hardware signal, euicc said false — no evidence
    // either way (eSIM may be merely switched off). Never claim without proof.
    return { state: 'unknown', ...no };
  }

  if (signals.platform === 'ios') {
    // OS positive — certain green (fires today only with the carrier
    // entitlement; costs nothing to honor and future-proofs the policy).
    if (signals.apiSupported) return { state: 'supported', certain: true, needsEnabling: false };

    const major = parseIphoneMajor(signals.model);
    // iPhone X (iPhone10,x) and older physically have no eSIM — certain red.
    if (major !== null && major <= 10) return { state: 'unsupported', certain: true, needsEnabling: false };
    // Modern iPhone (XS/XR+, 2018+). The OS positive can't fire without Apple's
    // carrier entitlement, so we present it as GREEN 'supported' by MODEL —
    // matching Airalo/industry apps — with `certain: false` so the banner keeps
    // the "How to check" help visible and surfaces the mainland-China dual-SIM
    // caveat there (the one model-indistinguishable exception). A proven install
    // upgrades this to a certain green.
    if (major !== null && major >= 11) return { state: 'supported', certain: false, needsEnabling: false };
    // iPad or unparseable identifier — out of scope, no claim.
    return { state: 'unknown', ...no };
  }

  return { state: 'unknown', ...no };
}

/** Tri-state-compatible wrapper — most callers only need the state. */
export function classifyEsim(signals: EsimSignals | null): EsimSupportState {
  return classifyEsimDetail(signals).state;
}
