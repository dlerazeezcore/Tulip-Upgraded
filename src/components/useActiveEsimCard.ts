// Wiring for ActiveEsimCard — reads the eSIM store, filters to active bundles
// and pre-shapes one view-model per card (labels, bar fraction, colors).
// THIN UI lives in ActiveEsimCard.tsx.
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useEsimStore } from '@/state/esimStore';
import { useEsimUsageFormatters } from '@/lib/esimUsage';

export type ActiveEsimItemVM = {
  id: string;
  iso: string;
  country: string;
  planSummary: string;
  amountLabel: string;
  amountSub: string;
  usedLabel: string;
  timeLabel: string;
  /** 0-100, already clamped — the usage bar's fill width in percent. */
  barPct: number;
  barColor: string;
  /** Color for the time-remaining label (warning tint when running low). */
  lowTint: string;
};

export function useActiveEsimCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmt = useEsimUsageFormatters();
  const router = useRouter();
  const esims = useEsimStore((s) => s.esims);
  const loaded = useEsimStore((s) => s.loaded);
  const storeError = useEsimStore((s) => s.error);
  const refresh = useEsimStore((s) => s.refresh);
  const active = esims.filter((e) => e.status === 'active');

  const items: ActiveEsimItemVM[] = active.map((e) => {
    // Use raw MB for the fraction so the bar reflects byte-level usage,
    // not the floored display-GB (974 MB must not read as a full 1 GB).
    const planMb = e.planGb * 1024;
    // FE-2: when the plan isn't GB-denominated (planGb 0) we can't compute a
    // fraction — show a full bar if data remains rather than a misleading empty one.
    const frac = e.unlimited ? 1 : planMb > 0 ? e.remainingMb / planMb : e.remainingMb > 0 ? 1 : 0;
    const low = !e.unlimited && (frac <= 0.2 || e.hoursLeft <= 48);
    return {
      id: e.id,
      iso: e.iso,
      country: e.country,
      // planGb is 0 for package-kind/pending labels — fall back to the store's
      // pre-resolved dataLabel (same source the manage list uses) so the card
      // never reads "0 GB" (mirrors the eSIM detail fix for audit finding #1).
      planSummary: e.unlimited
        ? tr('home.planSummaryUnlimited', { days: e.planDays })
        : e.planGb > 0
          ? tr('home.planSummary', { gb: e.planGb, days: e.planDays })
          : `${fmt.dataLabel(e.dataLabel)}${e.planDays > 0 ? ` · ${fmt.planDays(e.planDays)}` : ''}`,
      amountLabel: e.unlimited ? '∞' : fmt.dataAmount(e.remainingMb),
      amountSub: e.unlimited ? tr('home.unlimitedShort') : tr('home.left'),
      usedLabel: e.unlimited ? '—' : tr('home.used', { value: fmt.dataAmount(e.usedMb) }),
      timeLabel: fmt.timeRemaining(e.hoursLeft),
      barPct: Math.max(0, Math.min(frac, 1)) * 100,
      barColor: low ? t.warning : t.success,
      lowTint: low ? t.warning : t.fgMuted,
    };
  });

  return {
    items,
    headerTitle: active.length > 1 ? tr('home.activeEsims') : tr('home.activeEsim'),
    goEsim: (id: string) => router.push(`/esim/${id}`),
    /** First snapshot still on its way — show the card skeleton. */
    loading: !loaded && !storeError,
    /** First load failed with nothing to show — show the inline error row. */
    errored: !loaded && !!storeError,
    retry: () => {
      void refresh();
    },
  };
}
