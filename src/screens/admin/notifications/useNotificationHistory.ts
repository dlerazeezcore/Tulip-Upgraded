// Wiring for the admin "notification history" screen.
// Owns: paged list of past sends + pull-to-refresh.
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/state/authStore';
import { listPushNotifications } from '@/services/admin';
import type { PushNotificationRow } from '@/services/types';

export type NotificationHistoryViewModel = {
  isAdmin: boolean;
  goBack: () => void;
  rows: PushNotificationRow[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useNotificationHistory(): NotificationHistoryViewModel {
  const router = useRouter();
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

  return {
    isAdmin,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/admin/notifications')),
    rows,
    loading,
    refreshing,
    error,
    refresh: () => load('refresh'),
  };
}
