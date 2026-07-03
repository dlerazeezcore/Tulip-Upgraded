import { useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrderStore } from '@/state/orderStore';

export function useOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = useOrderStore((s) => s.byId(id));
  const refresh = useOrderStore((s) => s.refresh);

  // Refresh once when the order isn't cached (deep link / stale window). A
  // deep link to an order OUTSIDE the fetched window used to re-fire refresh()
  // on every render forever, since the order never appears (audit L4).
  const triedRefresh = useRef(false);
  useEffect(() => {
    if (order || triedRefresh.current) return;
    triedRefresh.current = true;
    refresh();
  }, [order, refresh]);

  const item = order?.items[0];
  const completed = order ? ['BOOKED', 'ACTIVE', 'COMPLETED', 'GOT_RESOURCE'].includes(String(order.status).toUpperCase()) : false;

  return {
    order,
    item,
    completed,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/orders')),
    goOrders: () => router.replace('/orders'),
    goManageEsim: () => router.replace('/manage/esim'),
  };
}
