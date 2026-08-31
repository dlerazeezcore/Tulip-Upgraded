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
  // filters — pre-shaped dropdown options; the screen just renders them
  year: number;
  month: number;
  esim: string;
  yearOptions: { value: number; label: string }[];
  monthOptions: { value: number; label: string }[];
  esimOptions: { value: string; label: string }[];
  monthLabel: (m: number) => string;
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

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
const ESIM_FILTER_IDS = ['all', 'installed', 'not_installed', 'expired', 'used'] as const;
/** First year with orders. The list runs from here to the current year and
 *  extends itself every January — it used to be a hardcoded [2026…2030]. */
const FIRST_ORDER_YEAR = 2026;

export function useAdminOrders(): AdminOrdersViewModel {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  // Default to the CURRENT month so the report opens on real data instead of an
  // empty "pick a year and month" state.
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
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

  // Always filtered server-side to one month, so we never pull the whole table.
  useEffect(() => {
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
          // Phone before "Unknown": a phone-only signup has no name, and the
          // number is a far more useful label than a placeholder.
          userName: o.user?.name || o.user?.phone || tr('admin.orders.unknownUser'),
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

  const monthLabel = useCallback(
    (m: number) => tr(`admin.orders.months.${MONTH_KEYS[m - 1]}`),
    [tr],
  );

  // Newest year first, so the default (current year) is at the top of the list.
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const last = Math.max(current, FIRST_ORDER_YEAR);
    const out: { value: number; label: string }[] = [];
    for (let y = last; y >= FIRST_ORDER_YEAR; y -= 1) out.push({ value: y, label: String(y) });
    return out.length ? out : [{ value: current, label: String(current) }];
  }, []);

  const monthOptions = useMemo(
    () => MONTH_KEYS.map((_, i) => ({ value: i + 1, label: monthLabel(i + 1) })),
    [monthLabel],
  );

  const esimOptions = useMemo(
    () => ESIM_FILTER_IDS.map((id) => ({ value: id as string, label: tr(`admin.orders.filters.${id}`) })),
    [tr],
  );

  return {
    isAdmin,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/admin')),
    year,
    month,
    esim,
    yearOptions,
    monthOptions,
    esimOptions,
    monthLabel,
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
