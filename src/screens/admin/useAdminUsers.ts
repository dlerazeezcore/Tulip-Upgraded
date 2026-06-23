// Wiring for the admin "users" screen.
// Owns: user list load, search query, edit-modal selection, and the
// loyalty/block/delete mutations.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/state/authStore';
import { getUsers, updateUser, deleteUser } from '@/services/admin';
import type { AdminUserRow } from '@/services/types';

export type AdminUsersViewModel = {
  isAdmin: boolean;
  goBack: () => void;
  // search
  q: string;
  setQ: (q: string) => void;
  // data
  rows: AdminUserRow[];
  users: AdminUserRow[];
  loading: boolean;
  error: string | null;
  // edit modal
  selected: AdminUserRow | null;
  setSelected: (u: AdminUserRow | null) => void;
  clearError: () => void;
  busy: boolean;
  // actions
  onToggleLoyalty: (u: AdminUserRow) => void;
  onToggleBlock: (u: AdminUserRow) => void;
  onDelete: (u: AdminUserRow) => void;
};

export function useAdminUsers(): AdminUsersViewModel {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getUsers({ limit: 200 })
      .then(setRows)
      .catch((e: any) => setError(e?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const users = useMemo(
    () => rows.filter((u) => `${u.name} ${u.phone}`.toLowerCase().includes(q.trim().toLowerCase())),
    [rows, q],
  );

  const applyLocal = (u: AdminUserRow) => {
    setRows((prev) => prev.map((r) => (r.id === u.id ? { ...r, ...u } : r)));
    setSelected((s) => (s && s.id === u.id ? { ...s, ...u } : s));
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const onToggleLoyalty = (u: AdminUserRow) => run(async () => applyLocal(await updateUser(u.id, { isLoyalty: !u.isLoyalty })));
  const onToggleBlock = (u: AdminUserRow) => run(async () => applyLocal(await updateUser(u.id, { blocked: !u.isBlocked })));
  const onDelete = (u: AdminUserRow) =>
    run(async () => {
      await deleteUser(u.id);
      setRows((prev) => prev.filter((r) => r.id !== u.id));
      setSelected(null);
    });

  return {
    isAdmin,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/admin')),
    q,
    setQ,
    rows,
    users,
    loading,
    error,
    selected,
    setSelected,
    clearError: () => setError(null),
    busy,
    onToggleLoyalty,
    onToggleBlock,
    onDelete,
  };
}
