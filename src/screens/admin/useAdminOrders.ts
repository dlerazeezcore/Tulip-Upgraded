// Wiring for the admin "order history" screen.
// Owns: year/month/eSIM filters, server-side order loading, provider refresh,
// row expand state, and the eSIM-status filtered list pre-shaped for render.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { getAdminOrders, refreshOrdersFromProvider, type RefreshOrdersResult } from '@/services/admin';
import { formatIqd } from '@/lib/pricing';
import type { AdminOrder } from '@/services/types';

export type AdminOrderLineVM = {
  id: number;
  countryCode: string | null;
  specLabel: string;
  priceLabel: string;
};

export type AdminOrderRowVM = {
  id: number;
  countryCode: string | null;
  userName: string;
  userPhone: string;
  subLabel: string;
  statusLabel: string;
  paymentMethod: string | null;
  totalLabel: string;
  expanded: boolean;
  itemCount: number;
  orderNumber: string;
  lines: AdminOrderLineVM[];
};

export type AdminOrdersViewModel = {
  isAdmin: boolean;
  goBack: () => void;
  // filters
  year: number;
  month: number | null;
  esim: string;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
  setEsim: (id: string) => void;
  // data
  orders: AdminOrder[];
  filtered: AdminOrderRowVM[];
  loading: boolean;
  error: string | null;
  // row expand
  toggle: (id: number) => void;
  // provider refresh
  refreshing: boolean;
  refreshSummary: RefreshOrdersResult | null;
  onRefreshFromProvider: () => Promise<void>;
};

function orderDate(o: AdminOrder): string {
  return o.bookedAt || o.createdAt || '';
}

export function useAdminOrders(): AdminOrdersViewModel {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(null); // 1-12; null = nothing selected yet
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [esim, setEsim] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const toggle = (id: number) => setExpanded((m) => ({ ...m, [id]: !m[id] }));
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSummary, setRefreshSummary] = useState<RefreshOrdersResult | null>(null);

  // Reload the same month's orders after an admin refresh. Triggered by the
  // "Refresh from provider" button below.
  const reloadCurrentMonth = useCallback(() => {
    if (month === null) return Promise.resolve();
    const key = `${year}-${String(month).padStart(2, '0')}`;
    return getAdminOrders({ month: key })
      .then((rows) => setOrders(rows))
      .catch((e: any) => setError(e?.message || 'Failed to reload orders'));
  }, [year, month]);

  const onRefreshFromProvider = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshSummary(null);
    try {
      const summary = await refreshOrdersFromProvider();
      setRefreshSummary(summary);
      await reloadCurrentMonth();
    } catch (e: any) {
      setRefreshSummary({
        attempted: 0, activeRefreshed: 0, placeholdersRecovered: 0,
        errorCount: 1, errors: [{ error: e?.message || 'Refresh failed' }],
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Load orders only once a year + month are chosen — filtered server-side, so
  // nothing is fetched by default and we never pull the whole table.
  useEffect(() => {
    if (month === null) {
      setOrders([]);
      return;
    }
    const key = `${year}-${String(month).padStart(2, '0')}`;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExpanded({});
    getAdminOrders({ month: key })
      .then((rows) => { if (!cancelled) setOrders(rows); })
      .catch((e: any) => { if (!cancelled) setError(e?.message || 'Failed to load orders'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year, month]);

  // Pre-shape each visible row (labels, spec lines, expand flag) so the list
  // renders fields only.
  const filtered = useMemo<AdminOrderRowVM[]>(() => {
    const esimLabel = (id: string) => tr(`admin.orders.esimStatus.${id}`, { defaultValue: id });
    return orders
      .filter((o) => esim === 'all' || o.esimStatus === esim)
      .map((o) => {
        // Defensive: one order row without items must not blank the whole
        // admin list (audit L3).
        const items = o.items ?? [];
        const it = items[0];
        const date = orderDate(o);
        return {
          id: o.id,
          countryCode: it?.countryCode ?? null,
          userName: o.user?.name || tr('admin.orders.unknownUser'),
          userPhone: o.user?.phone || '',
          subLabel: `${it?.countryName || it?.countryCode || tr('admin.orders.esim')}${date ? ` · ${new Date(date).toLocaleDateString()}` : ''}`,
          statusLabel: esimLabel(o.esimStatus).toUpperCase(),
          paymentMethod: o.paymentMethod ?? null,
          totalLabel: formatIqd(o.totalMinor ?? 0),
          expanded: !!expanded[o.id],
          itemCount: items.length,
          orderNumber: o.orderNumber,
          lines: items.map((item) => {
            const data = item.unlimited ? tr('admin.orders.unlimited') : item.dataGb ? `${item.dataGb} GB` : null;
            return {
              id: item.id,
              countryCode: item.countryCode ?? null,
              specLabel:
                [data, item.validityDays ? tr('admin.orders.daysCount', { count: item.validityDays }) : null]
                  .filter(Boolean)
                  .join(' · ') || tr('admin.orders.esimBundle'),
              priceLabel: formatIqd(item.salePriceMinor ?? 0),
            };
          }),
        };
      });
  }, [orders, esim, expanded, tr]);

  return {
    isAdmin,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/admin')),
    year,
    month,
    esim,
    setYear,
    setMonth,
    setEsim,
    orders,
    filtered,
    loading,
    error,
    toggle,
    refreshing,
    refreshSummary,
    onRefreshFromProvider,
  };
}
