import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICES, serviceRoute } from '@/data/services';
import { useEsimStore } from '@/state/esimStore';
import { useEsimUsageFormatters } from '@/lib/esimUsage';
import type { PillKind } from '@/components/StatusPill';

export type ManageEsimItemVM = {
  id: string;
  iso: string;
  country: string;
  planLine: string;
  pillKind: PillKind;
  pillLabel: string | undefined;
  hasUsageRow: boolean;
  /** 0-100, already clamped — the usage bar's fill width in percent. */
  barPct: number;
  barColor: string;
  remainingLabel: string;
  timeLabel: string;
  showTapToInstall: boolean;
};

export function useManageService() {
  const { service } = useLocalSearchParams<{ service: string }>();
  const { t: tr } = useTranslation();
  const t = useTheme();
  const fmt = useEsimUsageFormatters();
  const router = useRouter();
  const svc = SERVICES.find((s) => s.id === service);

  const title =
    service === 'esim' ? tr('bookings.myEsims')
    : service === 'hotels' ? tr('bookings.myStays')
    : service === 'flights' ? tr('manage.myFlights')
    : service === 'transfers' ? tr('manage.myTransfers')
    : service === 'cars' ? tr('manage.myCars')
    : tr('manage.myBookings');

  // For the eSIM tab we own a single refresh affordance (pull-to-refresh +
  // initial load) so the user can force-resync status/usage from the
  // provider on demand. This is what catches: a bundle that's been
  // refunded/cancelled provider-side, latest GB usage, and ONBOARDING ->
  // IN_USE transitions that beat the recover-poll on the detail screen.
  const refreshList = useEsimStore((s) => s.refresh);
  const refreshUsage = useEsimStore((s) => s.refreshUsage);
  const refreshing = useEsimStore((s) => s.refreshing);

  React.useEffect(() => {
    if (service === 'esim') refreshList();
  }, [service, refreshList]);

  const onPullToRefresh = React.useCallback(async () => {
    if (service !== 'esim') return;
    // refreshUsage hits /usage/sync/my which forces a provider round-trip,
    // then returns the latest list. That's strictly more authoritative than
    // refreshList (which only reads our DB), so use it for explicit refreshes.
    await refreshUsage();
  }, [service, refreshUsage]);

  // ── EsimList data ──
  // The backend filters out terminal (cancelled/refunded/expired) profiles by
  // default — this list shows only live bundles. Terminal ones live behind
  // the HistoryCard rendered alongside the list.
  const rawEsims = useEsimStore((s) => s.esims);
  const loaded = useEsimStore((s) => s.loaded);

  // Pre-shape each card's labels/bar so the list renders fields only.
  const esims: ManageEsimItemVM[] = rawEsims.map((e) => {
    // Show remaining GB on EVERY card the backend gave us data for, not
    // just active. A PROVIDER_WAITING bundle already has total/remaining
    // populated (the user paid for it), so showing it reassures them
    // that the plan exists even before the carrier reports IN_USE.
    // Use raw MB for the fraction so the bar reflects byte-level usage,
    // not the floored display-GB.
    const planMb = e.planGb * 1024;
    const frac = planMb > 0 ? e.remainingMb / planMb : 0;
    return {
      id: e.id,
      iso: e.iso,
      country: e.country,
      planLine: `${fmt.dataLabel(e.dataLabel)}${e.planDays > 0 ? ` · ${fmt.planDays(e.planDays)}` : ''}`,
      pillKind: e.status === 'provider_waiting' ? 'inactive' : e.status,
      pillLabel: e.status === 'provider_waiting' ? tr('status.provider_waiting') : undefined,
      hasUsageRow: e.planGb > 0 && (e.status === 'active' || e.status === 'provider_waiting'),
      barPct: e.unlimited ? 100 : Math.max(0, Math.min(frac, 1)) * 100,
      barColor: e.status === 'active' ? t.success : e.status === 'expired' ? t.danger : t.warning,
      remainingLabel: fmt.dataRemaining(e.remainingMb, e.unlimited),
      timeLabel: e.status === 'active' ? fmt.timeRemaining(e.hoursLeft) : tr('manage.waitingFirstConnection'),
      showTapToInstall: e.status === 'inactive',
    };
  });

  // ── HistoryCard data ──
  // Refresh the history count silently so the card always shows accurate
  // numbers without forcing the user onto the History screen.
  const history = useEsimStore((s) => s.history);
  const refreshHistory = useEsimStore((s) => s.refreshHistory);
  React.useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);
  const historyCount = history.length;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));
  const goBookNew = () => svc && router.push(serviceRoute(svc.id) as any);
  const goEsim = (id: string) => router.push(`/esim/${id}`);
  const goHistory = () => router.push('/manage/esim-history');

  return {
    service,
    svc,
    title,
    refreshing,
    onPullToRefresh,
    // list
    esims,
    loaded,
    // history card
    historyCount,
    // navigation
    goBack,
    goBookNew,
    goEsim,
    goHistory,
  };
}
