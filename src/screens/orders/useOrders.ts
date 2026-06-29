import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useOrderStore } from '@/state/orderStore';
import { useAuthStore } from '@/state/authStore';
import type { OrderSummary } from '@/services/types';

function orderDate(o: OrderSummary): string {
  return o.bookedAt || o.createdAt || new Date().toISOString();
}
function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

export function useOrders() {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const loaded = useOrderStore((s) => s.loaded);
  const refresh = useOrderStore((s) => s.refresh);
  // FE-6: re-fetch when the signed-in account changes (e.g. in-place sign-in),
  // not only on mount. A stable scalar avoids object-identity refresh loops.
  const authUserKey = useAuthStore((s) => s.user?.phone ?? null);

  useEffect(() => {
    refresh();
  }, [refresh, authUserKey]);

  const groups = useMemo(() => {
    const out: { label: string; items: OrderSummary[] }[] = [];
    for (const o of orders) {
      const label = monthLabel(orderDate(o));
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(o);
      else out.push({ label, items: [o] });
    }
    return out;
  }, [orders]);

  return {
    orders,
    loading,
    loaded,
    groups,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')),
    goOrder: (id: string | number) => router.push(`/orders/${id}`),
  };
}
