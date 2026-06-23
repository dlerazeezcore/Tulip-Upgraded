// Wiring for the admin "order history" screen.
// Owns: year/month/eSIM filters, server-side order loading, provider refresh,
// row expand state, and the eSIM-status filtered list.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/state/authStore';
import { getAdminOrders, refreshOrdersFromProvider, type RefreshOrdersResult } from '@/services/admin';
import type { AdminOrder } from '@/services/types';

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
  filtered: AdminOrder[];
  loading: boolean;
  error: string | null;
  // row expand
  expanded: Record<number, boolean>;
  toggle: (id: number) => void;
  // provider refresh
  refreshing: boolean;
  refreshSummary: RefreshOrdersResult | null;
  onRefreshFromProvider: () => Promise<void>;
};

export function useAdminOrders(): AdminOrdersViewModel {
  const router = useRouter();
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

  const filtered = useMemo(
    () => orders.filter((o) => esim === 'all' || o.esimStatus === esim),
    [orders, esim],
  );

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
    expanded,
    toggle,
    refreshing,
    refreshSummary,
    onRefreshFromProvider,
  };
}
