// Wiring for the admin "notification history" screen.
// Owns: paged list of past sends + pull-to-refresh, with each row pre-shaped
// (status color/label + localized date) so the screen renders fields only.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { useDateFormatters } from '@/lib/dates';
import { listPushNotifications } from '@/services/admin';
import type { PushNotificationRow } from '@/services/types';

export type NotificationHistoryRowVM = PushNotificationRow & {
  statusFg: string;
  statusBg: string;
  statusLabel: string;
  dateLabel: string;
};

export type NotificationHistoryViewModel = {
  isAdmin: boolean;
  goBack: () => void;
  rows: NotificationHistoryRowVM[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useNotificationHistory(): NotificationHistoryViewModel {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const t = useTheme();
  const { formatDateTime } = useDateFormatters();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const [rows, setRows] = useState<PushNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const result = await listPushNotifications({ limit: 100 });
      setRows(result);
    } catch (e: any) {
      setError(e?.message || 'Failed to load history');
    } finally {
      if (mode === 'initial') setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    load('initial');
  }, [isAdmin, load]);

  const shapedRows = useMemo<NotificationHistoryRowVM[]>(() => {
    const statusColor = (status: string): string => {
      const s = status.toLowerCase();
      if (s === 'sent') return t.success;
      if (s === 'partial') return t.warning;
      if (s === 'failed') return t.danger;
      return t.fgMuted; // dry_run and anything unknown
    };
    return rows.map((row) => {
      const sc = statusColor(row.status);
      return {
        ...row,
        statusFg: sc,
        statusBg: `${sc}20`,
        statusLabel: tr(`admin.notifications.history.status.${row.status.toLowerCase()}`, { defaultValue: row.status }),
        dateLabel: formatDateTime(row.sentAt || row.createdAt),
      };
    });
  }, [rows, t, tr, formatDateTime]);

  return {
    isAdmin,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/admin/notifications')),
    rows: shapedRows,
    loading,
    refreshing,
    error,
    refresh: () => load('refresh'),
  };
}
