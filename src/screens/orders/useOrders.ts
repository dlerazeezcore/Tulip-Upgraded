import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '@/state/orderStore';
import { useAuthStore } from '@/state/authStore';
import { useDateFormatters } from '@/lib/dates';
import { formatIqd } from '@/lib/pricing';
import type { OrderSummary } from '@/services/types';

function orderDate(o: OrderSummary): string {
  return o.bookedAt || o.createdAt || new Date().toISOString();
}

export type OrderRowVM = {
  id: number;
  countryCode: string | null;
  title: string;
  packageName: string | null;
  /** "Jun 12" plus the payment method suffix when present. */
  dateLabel: string;
  totalLabel: string;
  completed: boolean;
  statusLabel: string;
};

export function useOrders() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const loaded = useOrderStore((s) => s.loaded);
  const refresh = useOrderStore((s) => s.refresh);
  const { formatShortDay, formatMonthYear } = useDateFormatters();
  // FE-6: re-fetch when the signed-in account changes (e.g. in-place sign-in),
  // not only on mount. A stable scalar avoids object-identity refresh loops.
  const authUserKey = useAuthStore((s) => s.user?.phone ?? null);

  useEffect(() => {
    refresh();
  }, [refresh, authUserKey]);

  const groups = useMemo(() => {
    const toRow = (o: OrderSummary): OrderRowVM => {
      const it = o.items[0];
      return {
        id: o.id,
        countryCode: it?.countryCode ?? null,
        title: it?.countryName ? tr('orders.countryEsim', { country: it.countryName }) : tr('orders.esimOrder'),
        packageName: it?.packageName ?? null,
        dateLabel: `${formatShortDay(orderDate(o))}${o.paymentMethod ? ` · ${o.paymentMethod}` : ''}`,
        totalLabel: formatIqd(o.totalMinor ?? 0),
        completed: ['BOOKED', 'ACTIVE', 'COMPLETED', 'GOT_RESOURCE'].includes(String(o.status).toUpperCase()),
        statusLabel: tr(`status.${String(o.status).toLowerCase()}`, { defaultValue: String(o.status) }),
      };
    };
    const out: { label: string; items: OrderRowVM[] }[] = [];
    for (const o of orders) {
      const label = formatMonthYear(orderDate(o));
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(toRow(o));
      else out.push({ label, items: [toRow(o)] });
    }
    return out;
  }, [orders, formatShortDay, formatMonthYear, tr]);

  return {
    orders,
    loading,
    loaded,
    groups,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')),
    goOrder: (id: string | number) => router.push(`/orders/${id}`),
  };
}
