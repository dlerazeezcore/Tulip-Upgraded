// Wiring for EsimCompatibilityBanner — derives the banner's tone, colours, copy
// and the "How to check" expand/collapse state from the cached device eSIM
// support result (useDeviceStore, hydrated once at app launch).
// THIN UI lives in EsimCompatibilityBanner.tsx.
import { useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useDeviceStore } from '@/state/deviceStore';

export type CompatTone = 'compatible' | 'incompatible' | 'unknown';

export type EsimCompatibilityVM = {
  tone: CompatTone;
  bg: string;
  borderColor: string;
  fg: string;
  Icon: LucideIcon;
  title: string;
  /** false only in the green 'compatible' state — there's nothing to check. */
  showHelp: boolean;
  helpExpanded: boolean;
  toggleHelp: () => void;
  helpLabel: string;
  helpBody: string;
};

export function useEsimCompatibilityBanner(): EsimCompatibilityVM {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const esimSupport = useDeviceStore((s) => s.esimSupport);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const toggleHelp = useCallback(() => setHelpExpanded((v) => !v), []);

  const help = {
    helpExpanded,
    toggleHelp,
    helpLabel: tr('esimStore.howToCheck'),
    helpBody: tr('esimStore.howToCheckBody'),
  };

  // Green — OS confirmed eSIM hardware. Soft green tint (matches StatusPill).
  if (esimSupport === 'supported') {
    return {
      tone: 'compatible',
      bg: 'rgba(22,163,74,0.12)',
      borderColor: 'rgba(22,163,74,0.40)',
      fg: t.success,
      Icon: CheckCircle2,
      title: tr('esimStore.deviceCompatible'),
      showHelp: false,
      ...help,
    };
  }

  // Red — OS confirmed no eSIM hardware. Softened to "may not" + help, because
  // Android can report false when eSIM is merely switched off.
  if (esimSupport === 'unsupported') {
    return {
      tone: 'incompatible',
      bg: 'rgba(220,38,38,0.12)',
      borderColor: 'rgba(220,38,38,0.40)',
      fg: t.danger,
      Icon: AlertTriangle,
      title: tr('esimStore.deviceIncompatible'),
      showHelp: true,
      ...help,
    };
  }

  // Neutral — web / Expo Go / simulator, where we genuinely cannot tell.
  return {
    tone: 'unknown',
    bg: t.infoBg,
    borderColor: t.border,
    fg: t.infoFg,
    Icon: Info,
    title: tr('esimStore.deviceUnknown'),
    showHelp: true,
    ...help,
  };
}
