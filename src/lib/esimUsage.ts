/**
 * Display helpers for the eSIM usage / countdown row.
 *
 * The provider reports usage with byte-level precision but we previously
 * rounded the remaining MB up to the nearest 0.1 GB, which made a bundle
 * with 974 MB left display as "1.0 GB left" — indistinguishable from a
 * fresh bundle. These helpers prefer the precise unit (MB) when the
 * remaining is small, and surface hours when there's less than a full day
 * left so the user's number matches the provider's countdown exactly.
 *
 * Split into pure "parts" functions (magnitude + unit kind, no words) and a
 * `useEsimUsageFormatters` hook that renders them through i18n — so ar/ku
 * never see baked-in English units the way the old string formatters leaked.
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { EsimDataLabel } from '@/state/esimStore';

export type DataParts =
  | { kind: 'unlimited' }
  | { kind: 'mb'; mb: number }
  | { kind: 'gb'; gb: string };

/** Magnitude + unit for a data amount. Floors GB to 1 decimal so a 974 MB row
 *  never reads as "1.0 GB". */
export function dataParts(mb: number, unlimited?: boolean): DataParts {
  if (unlimited) return { kind: 'unlimited' };
  const whole = Math.max(0, Math.floor(mb));
  if (whole < 1024) return { kind: 'mb', mb: whole };
  const gb = Math.floor((whole / 1024) * 10) / 10;
  return { kind: 'gb', gb: gb.toFixed(1) };
}

export type TimeParts =
  | { kind: 'expired' }
  | { kind: 'min'; min: number }
  | { kind: 'hours'; hours: number }
  | { kind: 'days'; days: number }
  | { kind: 'daysHours'; days: number; hours: number };

/** Granularity matches the eSIM Access dashboard countdown. */
export function timeParts(hoursLeft: number): TimeParts {
  const minutes = Math.max(0, Math.floor(hoursLeft * 60));
  if (minutes <= 0) return { kind: 'expired' };
  if (minutes < 60) return { kind: 'min', min: minutes };
  const totalHours = Math.floor(minutes / 60);
  if (totalHours < 24) return { kind: 'hours', hours: totalHours };
  const days = Math.floor(totalHours / 24);
  const hoursRem = totalHours - days * 24;
  if (hoursRem === 0) return { kind: 'days', days };
  return { kind: 'daysHours', days, hours: hoursRem };
}

/** Localized usage/countdown formatters. All user-visible strings flow through
 *  i18n keys (esim.usage.*) so every locale renders its own units/phrases. */
export function useEsimUsageFormatters() {
  const { t: tr } = useTranslation();

  /** "974 MB" / "0.9 GB" / "Unlimited" — bare magnitude for ring/stat centers. */
  const dataAmount = useCallback(
    (mb: number, unlimited?: boolean): string => {
      const p = dataParts(mb, unlimited);
      if (p.kind === 'unlimited') return tr('esim.unlimited');
      return p.kind === 'mb' ? tr('esim.usage.mb', { n: p.mb }) : tr('esim.usage.gb', { n: p.gb });
    },
    [tr],
  );

  /** "974 MB left" / "0.9 GB left" / "Unlimited". */
  const dataRemaining = useCallback(
    (mb: number, unlimited?: boolean): string => {
      if (unlimited) return tr('esim.unlimited');
      return tr('esim.usage.left', { value: dataAmount(mb) });
    },
    [tr, dataAmount],
  );

  /** "27 min" / "12 hours" / "6d 14h" / "Expired" — bare magnitude. */
  const timeAmount = useCallback(
    (hoursLeft: number): string => {
      const p = timeParts(hoursLeft);
      switch (p.kind) {
        case 'expired':
          return tr('esim.usage.expired');
        case 'min':
          return tr('esim.usage.min', { n: p.min });
        case 'hours':
          return tr(p.hours === 1 ? 'esim.usage.hour' : 'esim.usage.hours', { n: p.hours });
        case 'days':
          return tr(p.days === 1 ? 'esim.usage.day' : 'esim.usage.days', { n: p.days });
        case 'daysHours':
          return tr('esim.usage.daysHours', { d: p.days, h: p.hours });
      }
    },
    [tr],
  );

  /** "27 min left" / "6d 14h left" / "Expired". */
  const timeRemaining = useCallback(
    (hoursLeft: number): string => {
      const p = timeParts(hoursLeft);
      if (p.kind === 'expired') return tr('esim.usage.expired');
      return tr('esim.usage.left', { value: timeAmount(hoursLeft) });
    },
    [tr, timeAmount],
  );

  /** Localized rendering of the store's pre-resolved plan label. */
  const dataLabel = useCallback(
    (label: EsimDataLabel): string => {
      switch (label.kind) {
        case 'gb':
          return tr('esim.usage.gb', { n: label.gb });
        case 'unlimited':
          return tr('esim.unlimitedData');
        case 'package':
          return label.name;
        case 'pending':
          return tr('esim.usage.planPending');
      }
    },
    [tr],
  );

  /** "7 days" — the plan-validity suffix on manage/history rows. */
  const planDays = useCallback((n: number): string => tr('esim.usage.planDays', { n }), [tr]);

  return { dataAmount, dataRemaining, timeAmount, timeRemaining, dataLabel, planDays };
}
