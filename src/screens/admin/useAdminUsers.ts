// Wiring for the admin "users" screen.
// Owns: user list load, search query, edit-modal selection, the
// loyalty/block/delete mutations, and the per-user app-version state
// (on latest / outdated / unknown vs the published latestVersion).
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { getUsers, updateUser, deleteUser, getAppVersionInfo } from '@/services/admin';
import { compareVersions } from '@/state/updateStore';
import { initials } from '@/lib/initials';
import type { AdminUserRow } from '@/services/types';

export type UserVersionKind = 'latest' | 'outdated' | 'unknown';

export type AdminUsersViewModel = {
  isAdmin: boolean;
  goBack: () => void;
  // search
  q: string;
  setQ: (q: string) => void;
  // data
  rows: AdminUserRow[];
  users: (AdminUserRow & { initials: string; versionKind: UserVersionKind; versionLabel: string })[];
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
  const { t: tr } = useTranslation();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [latestVersion, setLatestVersion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // FE-4: only fetch once we know the actor is an admin (matches sibling admin
    // hooks). Avoids firing an admin request that the backend will reject.
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getUsers({ limit: 200 })
      .then(setRows)
      .catch((e: any) => setError(e?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
    // Best-effort: the published latest version powers the per-user
    // "on latest?" pill; without it every user shows as unknown.
    getAppVersionInfo()
      .then((info) => setLatestVersion(info.latestVersion || ''))
      .catch(() => {});
  }, [isAdmin]);

  const users = useMemo(
    () =>
      rows
        .filter((u) => `${u.name} ${u.phone}`.toLowerCase().includes(q.trim().toLowerCase()))
        .map((u) => {
          const reported = (u.appVersion || '').trim();
          const versionKind: UserVersionKind =
            !reported || !latestVersion
              ? 'unknown'
              : compareVersions(reported, latestVersion) >= 0
                ? 'latest'
                : 'outdated';
          const versionLabel =
            versionKind === 'latest'
              ? tr('admin.users.onLatest')
              : versionKind === 'outdated'
                ? `v${reported}`
                : '—';
          return { ...u, initials: initials(u.name), versionKind, versionLabel };
        }),
    [rows, q, latestVersion, tr],
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
