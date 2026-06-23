import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrderStore } from '@/state/orderStore';

export function useOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = useOrderStore((s) => s.byId(id));
  const refresh = useOrderStore((s) => s.refresh);

  useEffect(() => {
    if (!order) refresh();
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
