import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/state/authStore';
import { listFeaturedLocations, saveFeaturedLocation, deleteFeaturedLocation } from '@/services/admin';
import type { FeaturedLocationAdmin } from '@/services/types';

export type AdminFeaturedViewModel = {
  isAdmin: boolean;
  rows: FeaturedLocationAdmin[];
  loading: boolean;
  busy: boolean;
  adding: boolean;
  setAdding: (v: boolean) => void;
  code: string;
  setCode: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  confirmRow: FeaturedLocationAdmin | null;
  setConfirmRow: (v: FeaturedLocationAdmin | null) => void;
  goBack: () => void;
  onAdd: () => void;
  toggleEnabled: (row: FeaturedLocationAdmin) => void;
  onDelete: (row: FeaturedLocationAdmin) => void;
  confirmDelete: () => void;
  onChangeCode: (v: string) => void;
  onChangeSortOrder: (v: string) => void;
};

export function useAdminFeatured(): AdminFeaturedViewModel {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);

  const [rows, setRows] = useState<FeaturedLocationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [confirmRow, setConfirmRow] = useState<FeaturedLocationAdmin | null>(null);

  const load = () => {
    setLoading(true);
    listFeaturedLocations()
      .then(setRows)
      .catch((e: any) => Alert.alert('Error', e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); load(); } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const onAdd = () =>
    run(async () => {
      if (!code.trim() || !name.trim()) return;
      await saveFeaturedLocation({ code, name, sortOrder: parseInt(sortOrder, 10) || 0, isPopular: true, enabled: true });
      setAdding(false); setCode(''); setName(''); setSortOrder('0');
    });

  const toggleEnabled = (row: FeaturedLocationAdmin) =>
    run(() => saveFeaturedLocation({
      code: row.code, name: row.name, sortOrder: row.sort_order ?? 0,
      isPopular: row.is_popular ?? true, enabled: !(row.enabled ?? true), locationType: row.location_type,
    }));

  // Inline confirm modal instead of Alert.alert (which is a no-op on web,
  // so the delete button appeared to "do nothing" in the browser).
  const onDelete = (row: FeaturedLocationAdmin) => setConfirmRow(row);
  const confirmDelete = () => {
    const row = confirmRow;
    if (!row) return;
    setConfirmRow(null);
    run(() => deleteFeaturedLocation(row.id));
  };

  return {
    isAdmin,
    rows,
    loading,
    busy,
    adding,
    setAdding,
    code,
    setCode,
    name,
    setName,
    sortOrder,
    setSortOrder,
    confirmRow,
    setConfirmRow,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/admin')),
    onAdd,
    toggleEnabled,
    onDelete,
    confirmDelete,
    onChangeCode: (v: string) => setCode(v.toUpperCase().slice(0, 2)),
    onChangeSortOrder: (v: string) => setSortOrder(v.replace(/[^\d]/g, '')),
  };
}
