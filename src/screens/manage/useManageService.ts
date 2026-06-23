import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SERVICES, serviceRoute } from '@/data/services';
import { useEsimStore } from '@/state/esimStore';

export function useManageService() {
  const { service } = useLocalSearchParams<{ service: string }>();
  const { t: tr } = useTranslation();
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
  const esims = useEsimStore((s) => s.esims);
  const loaded = useEsimStore((s) => s.loaded);

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
