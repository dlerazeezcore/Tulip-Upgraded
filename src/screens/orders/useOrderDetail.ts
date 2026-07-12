import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '@/state/orderStore';
import { formatIqd } from '@/lib/pricing';
import { useDateFormatters } from '@/lib/dates';

export function useOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { formatDateTime } = useDateFormatters();
  const order = useOrderStore((s) => s.byId(id));
  const refresh = useOrderStore((s) => s.refresh);

  // Refresh once when the order isn't cached (deep link / stale window). A
  // deep link to an order OUTSIDE the fetched window used to re-fire refresh()
  // on every render forever, since the order never appears (audit L4).
  // `settled` flips once that first refresh finishes (or the order shows up),
  // so the screen can render a skeleton instead of a premature "not found"
  // while the fetch is still in flight (audit #4).
  const triedRefresh = useRef(false);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (order) {
      if (!settled) setSettled(true);
      return;
    }
    if (triedRefresh.current) return;
    triedRefresh.current = true;
    refresh().finally(() => setSettled(true));
  }, [order, refresh, settled]);

  const item = order?.items[0];
  const completed = order ? ['BOOKED', 'ACTIVE', 'COMPLETED', 'GOT_RESOURCE'].includes(String(order.status).toUpperCase()) : false;

  // Pre-shaped view-model (THIN UI): the screen renders these verbatim.
  const title = item?.countryName ? tr('orders.countryEsim', { country: item.countryName }) : tr('orders.esimOrder');
  const statusLabel = order ? String(order.status).toLowerCase() : '';
  const rows: [string, string][] = order
    ? [
        [tr('orders.rowOrderNumber'), order.orderNumber],
        [tr('orders.rowDate'), formatDateTime(order.bookedAt || order.createdAt)],
        [tr('orders.rowPaymentMethod'), order.paymentMethod || '—'],
        [tr('orders.rowDestination'), item?.countryName || '—'],
        [tr('orders.rowPlan'), item?.packageName || item?.packageCode || '—'],
        [tr('orders.rowQuantity'), String(item?.quantity ?? 1)],
      ]
    : [];
  const totalLabel = formatIqd(order?.totalMinor ?? 0);

  return {
    order,
    item,
    completed,
    title,
    statusLabel,
    rows,
    totalLabel,
    /** True until the first refresh settles — render a skeleton, not "not found". */
    loading: !order && !settled,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/orders')),
    goOrders: () => router.replace('/orders'),
    goManageEsim: () => router.replace('/manage/esim'),
  };
}
