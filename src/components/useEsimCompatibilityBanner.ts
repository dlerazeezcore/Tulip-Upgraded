// Wiring for EsimCompatibilityBanner — derives the banner's tone, colours, copy
// and the "How to check" expand/collapse state from the cached device eSIM
// verdict (useDeviceStore, hydrated once at app launch).
// THIN UI lives in EsimCompatibilityBanner.tsx.
//
// Four states (decided by src/lib/esimPolicy.ts — read its header before
// changing which state gets which claim):
//   supported   → green. Certain evidence only. Help hidden, EXCEPT the
//                 Android "hardware present but eSIM disabled" nuance.
//   likely      → info-blue. Modern iPhone where the OS check is entitlement-
//                 locked: "supports eSIM unless bought in mainland China".
//                 True for every device that sees it — never a false claim.
//   unsupported → red. Certain hardware evidence only.
//   unknown     → neutral. Web / Expo Go / simulator / iPad.
import { useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useDeviceStore } from '@/state/deviceStore';

export type CompatTone = 'compatible' | 'likely' | 'incompatible' | 'unknown';

export type EsimCompatibilityVM = {
  tone: CompatTone;
  bg: string;
  borderColor: string;
  fg: string;
  Icon: LucideIcon;
  title: string;
  /** false only for a CERTAIN green with nothing to act on. */
  showHelp: boolean;
  helpExpanded: boolean;
  toggleHelp: () => void;
  helpLabel: string;
  helpBody: string;
};

export function useEsimCompatibilityBanner(): EsimCompatibilityVM {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const verdict = useDeviceStore((s) => s.esimVerdict);
  const signals = useDeviceStore((s) => s.esimSignals);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const toggleHelp = useCallback(() => setHelpExpanded((v) => !v), []);

  // Tiny technical footer inside the expanded help: lets a support conversation
  // (or a future bug report) identify the device and raw signals on sight.
  const diag = signals
    ? `\n\n${signals.model || signals.platform} · api ${signals.apiSupported ? '✓' : '—'} · hw ${
        signals.hardwareSupported === null ? '?' : signals.hardwareSupported ? '✓' : '—'
      }${signals.provenInstalled ? ' · installed ✓' : ''}`
    : '';

  const helpCommon = {
    helpExpanded,
    toggleHelp,
    helpLabel: tr('esimStore.howToCheck'),
  };

  // Green — certain evidence (OS positive, proven install, or Android hardware
  // flag). Help only surfaces for the Android "eSIM disabled" nuance.
  if (verdict.state === 'supported') {
    return {
      tone: 'compatible',
      bg: t.successBg,
      borderColor: `${t.success}66`,
      fg: t.successFg,
      Icon: CheckCircle2,
      title: tr('esimStore.deviceCompatible'),
      showHelp: verdict.needsEnabling,
      helpBody: verdict.needsEnabling ? `${tr('esimStore.esimDisabledNote')}${diag}` : '',
      ...helpCommon,
    };
  }

  // Info-blue — modern iPhone, entitlement-locked OS check. The title is true
  // for global AND mainland-China dual-SIM units; help explains the 10-second
  // EID check plus the China-variant caveat.
  if (verdict.state === 'likely') {
    return {
      tone: 'likely',
      bg: t.infoBg,
      borderColor: `${t.info}66`,
      fg: t.infoFg,
      Icon: Info,
      title: tr('esimStore.deviceLikely'),
      showHelp: true,
      helpBody: `${tr('esimStore.dualSimCaveat')}\n\n${tr('esimStore.howToCheckBody')}${diag}`,
      ...helpCommon,
    };
  }

  // Red — certain hardware evidence that eSIM cannot work on this device.
  if (verdict.state === 'unsupported') {
    return {
      tone: 'incompatible',
      bg: t.dangerBg,
      borderColor: `${t.danger}66`,
      fg: t.dangerFg,
      Icon: AlertTriangle,
      title: tr('esimStore.deviceIncompatible'),
      showHelp: true,
      helpBody: `${tr('esimStore.howToCheckBody')}${diag}`,
      ...helpCommon,
    };
  }

  // Neutral — web / Expo Go / simulator / iPad, where we genuinely cannot tell.
  return {
    tone: 'unknown',
    bg: t.infoBg,
    borderColor: t.border,
    fg: t.infoFg,
    Icon: Info,
    title: tr('esimStore.deviceUnknown'),
    showHelp: true,
    helpBody: `${tr('esimStore.howToCheckBody')}${diag}`,
    ...helpCommon,
  };
}
