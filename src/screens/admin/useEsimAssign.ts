// Wiring for the admin "assign an eSIM to a customer" screen (concierge sale).
// Owns: customer search/selection, destination + bundle catalog, the confirm
// step, submission and the best-effort customer notification.
//
// The admin buys on behalf of a registered customer who can't or won't check
// out themselves; money is collected outside the app. The order lands on the
// customer at the normal retail price so it is indistinguishable from a
// self-purchase in their app.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { confirmAction } from '@/lib/dialog';
import { useAuthStore } from '@/state/authStore';
import { useIsWideWeb } from '@/lib/responsive';
import { useMoney } from '@/lib/money';
import { useIqdAmount } from '@/lib/pricing';
import { packagesToBundles } from '@/lib/catalog';
import { assignEsimToUser, getUsers, sendPushNotification } from '@/services/admin';
import {
  cachedCountries,
  getCountries,
  getFeaturedLocations,
  getRegions,
  listMyProfiles,
  queryPackages,
} from '@/services/esim';
import type { AdminUserRow, ManagedOrderResult } from '@/services/types';
import type { Bundle } from '@/data/esim';

export type AssignTab = 'popular' | 'countries' | 'regions';

/**
 * Mirrors the backend's `_is_row_active`: an order can only be assigned to an
 * account that is active, not blocked and not deleted. The admin users endpoint
 * hides deleted rows by default but still returns BLOCKED ones, so without this
 * the picker offers customers the assign call would reject with a 403.
 *
 * Field casing is defensive: /api/v1/admin/users serializes raw column names
 * (blocked_at), while the AdminUserRow type describes a camelCase shape.
 */
function isAssignableUser(u: AdminUserRow): boolean {
  const row = u as AdminUserRow & Record<string, unknown>;
  const status = String(row.status ?? '').trim().toLowerCase();
  const blocked = row.blocked_at ?? row.blockedAt ?? (u.isBlocked ? true : null);
  const deleted = row.deleted_at ?? row.deletedAt ?? null;
  return status === 'active' && !blocked && !deleted;
}

export type AssignPlace = { code: string; name: string; isRegion: boolean };

export type BundleGroup = { days: number; items: Bundle[] };

export type EsimAssignViewModel = {
  isAdmin: boolean;
  isWide: boolean;
  goBack: () => void;
  goOrders: () => void;

  // Step 1 — customer
  search: string;
  setSearch: (v: string) => void;
  users: AdminUserRow[];
  loadingUsers: boolean;
  selectedUser: AdminUserRow | null;
  selectUser: (u: AdminUserRow | null) => void;

  // Step 2 — destination + bundle
  tab: AssignTab;
  setTab: (t: AssignTab) => void;
  places: AssignPlace[];
  loadingPlaces: boolean;
  selectedPlace: AssignPlace | null;
  selectPlace: (p: AssignPlace | null) => void;
  placeSearch: string;
  setPlaceSearch: (v: string) => void;
  groups: BundleGroup[];
  loadingBundles: boolean;
  bundlesError: string | null;
  selectedBundle: Bundle | null;
  selectBundle: (b: Bundle | null) => void;
  priceLabel: (b: Bundle) => string;
  bundleLabel: (b: Bundle) => string;

  // Step 3 — confirm
  summaryPrice: string | null;
  duplicateWarning: string | null;
  canSubmit: boolean;
  submitting: boolean;
  error: string | null;
  result: { providerOrderNo: string | null; orderItemId: number | null } | null;
  submit: () => void;
  reset: () => void;
};

export function useEsimAssign(): EsimAssignViewModel {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const isWide = useIsWideWeb();
  const money = useMoney();
  const iqdAmount = useIqdAmount();

  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

  const [tab, setTab] = useState<AssignTab>('popular');
  const [places, setPlaces] = useState<AssignPlace[]>([]);
  // Featured rows store whatever an admin typed in `name`, which for most of
  // them is just the ISO code ("GB", "TR", "DE"). Resolve display names from the
  // provider country list instead, same as the customer catalog does.
  const [nameByCode, setNameByCode] = useState<Record<string, string>>({});
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<AssignPlace | null>(null);

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [bundlesError, setBundlesError] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EsimAssignViewModel['result']>(null);

  // ── Step 1: debounced customer search ──────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    const timer = setTimeout(() => {
      getUsers({ limit: 60, search: search.trim() || undefined })
        .then((rows) => setUsers(rows.filter(isAssignableUser)))
        .catch(() => setUsers([]))
        .finally(() => setLoadingUsers(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [isAdmin, search]);

  // ── Country/region name lookup, loaded once ────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const merge = (rows: { code: string; name: string }[]) => {
      if (cancelled || rows.length === 0) return;
      setNameByCode((prev) => {
        const next = { ...prev };
        for (const r of rows) {
          // Ignore placeholder names that are just the code again.
          if (r.name && r.name.toUpperCase() !== r.code.toUpperCase()) {
            next[r.code.toUpperCase()] = r.name;
          }
        }
        return next;
      });
    };
    merge(cachedCountries());
    getCountries().then(merge).catch(() => {});
    getRegions().then(merge).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // ── Step 2: destinations for the active tab ────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoadingPlaces(true);
    const load = async (): Promise<AssignPlace[]> => {
      if (tab === 'regions') {
        const regions = await getRegions();
        return regions.map((r) => ({ code: r.code, name: r.name, isRegion: true }));
      }
      if (tab === 'countries') {
        const countries = await getCountries();
        return countries.map((c) => ({ code: c.code, name: c.name, isRegion: false }));
      }
      const featured = await getFeaturedLocations('esim');
      return featured.map((f) => ({
        code: f.code,
        name: f.name,
        isRegion: (f.locationType ?? 'country') === 'region',
      }));
    };
    load()
      .then((next) => {
        if (!cancelled) setPlaces(next);
      })
      .catch(() => {
        if (!cancelled) setPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPlaces(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, tab]);

  // ── Step 2: bundles for the selected destination ───────────────────
  useEffect(() => {
    if (!selectedPlace) {
      setBundles([]);
      setSelectedBundle(null);
      return;
    }
    let cancelled = false;
    setLoadingBundles(true);
    setBundlesError(null);
    setSelectedBundle(null);
    queryPackages({ locationCode: selectedPlace.code })
      .then((packages) => {
        if (cancelled) return;
        // On a country, keep only that country's own plans (drop regional
        // bundles it merely belongs to) — same filter as the customer screen.
        setBundles(
          packagesToBundles(packages, selectedPlace.code, {
            countryCode: selectedPlace.isRegion ? undefined : selectedPlace.code,
          }),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setBundles([]);
        setBundlesError(tr('admin.esimAssign.bundlesError'));
      })
      .finally(() => {
        if (!cancelled) setLoadingBundles(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPlace, tr]);

  // Group by duration ascending, cheapest first inside each group — the same
  // shape the customer-facing place screen uses.
  const groups = useMemo<BundleGroup[]>(() => {
    const byDays = new Map<number, Bundle[]>();
    for (const b of bundles) {
      const arr = byDays.get(b.days) ?? [];
      arr.push(b);
      byDays.set(b.days, arr);
    }
    return [...byDays.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([days, items]) => ({ days, items: items.sort((x, y) => x.usd - y.usd) }));
  }, [bundles]);

  // useMoney already resolves the sale price itself — (providerUsd, saleIqdOverride).
  // Feeding it an already-converted IQD amount multiplies by the rate a second
  // time. Same call shape as the customer catalog (app/esim-store/[place].tsx).
  const priceLabel = useCallback((b: Bundle) => money(b.usd, b.saleIqdMinor), [money]);

  const bundleLabel = useCallback(
    (b: Bundle) =>
      b.type === 'unlimited'
        ? tr('esim.unlimitedData')
        : tr('admin.esimAssign.gbLabel', { count: b.gb ?? 0 }),
    [tr],
  );

  const summaryPrice = useMemo(
    () => (selectedBundle ? priceLabel(selectedBundle) : null),
    [selectedBundle, priceLabel],
  );

  // ── Duplicate check: warn, never block ─────────────────────────────
  useEffect(() => {
    setDuplicateWarning(null);
    if (!selectedUser || !selectedBundle?.packageCode) return;
    let cancelled = false;
    const packageCode = selectedBundle.packageCode;
    listMyProfiles({ userId: selectedUser.id, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        const held = (res.profiles ?? []).some(
          (p) => p.packageCode === packageCode && p.status !== 'expired',
        );
        if (held) setDuplicateWarning(tr('admin.esimAssign.duplicateWarning'));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedUser, selectedBundle, tr]);

  const canSubmit = !!(
    selectedUser &&
    selectedBundle?.packageCode &&
    selectedBundle.providerPriceMinor != null &&
    !submitting
  );

  const reset = useCallback(() => {
    setSelectedUser(null);
    setSelectedPlace(null);
    setSelectedBundle(null);
    setSearch('');
    setPlaceSearch('');
    setDuplicateWarning(null);
    setError(null);
    setResult(null);
  }, []);

  const notifyCustomer = useCallback(
    async (user: AdminUserRow, place: AssignPlace) => {
      // Best effort. A push failure must never read as an assignment failure —
      // the eSIM is already on the customer's account either way.
      const body = tr('admin.esimAssign.pushBody', { place: place.name });
      await sendPushNotification({
        userIds: [user.id],
        title: tr('admin.esimAssign.pushTitle'),
        body,
        titles: {
          en: tr('admin.esimAssign.pushTitle', { lng: 'en' }),
          ar: tr('admin.esimAssign.pushTitle', { lng: 'ar' }),
          ku: tr('admin.esimAssign.pushTitle', { lng: 'ku' }),
        },
        bodies: {
          en: tr('admin.esimAssign.pushBody', { lng: 'en', place: place.name }),
          ar: tr('admin.esimAssign.pushBody', { lng: 'ar', place: place.name }),
          ku: tr('admin.esimAssign.pushBody', { lng: 'ku', place: place.name }),
        },
      });
    },
    [tr],
  );

  const submit = useCallback(async () => {
    const user = selectedUser;
    const bundle = selectedBundle;
    const place = selectedPlace;
    if (!user || !bundle || !place) return;
    // The provider price must come from the catalog row, never re-derived from
    // the display float (a known silent rounding source). Refuse rather than guess.
    const providerPriceMinor = bundle.providerPriceMinor;
    const packageCode = bundle.packageCode;
    if (providerPriceMinor == null || !packageCode) {
      setError(tr('admin.esimAssign.bundleUnavailable'));
      return;
    }

    const confirmed = await confirmAction({
      title: tr('admin.esimAssign.confirmTitle'),
      message: tr('admin.esimAssign.confirmBody', {
        name: user.name || user.phone,
        phone: user.phone,
        place: place.name,
        price: priceLabel(bundle),
      }),
      confirmLabel: tr('admin.esimAssign.confirmCta'),
      cancelLabel: tr('common.cancel'),
    });
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const res: ManagedOrderResult = await assignEsimToUser({
        targetUserId: user.id,
        packageCode,
        providerPriceMinor,
        periodNum: bundle.periodNum ?? bundle.days,
        countryCode: place.isRegion ? undefined : place.code,
        countryName: place.name,
        packageName: `${place.name} ${bundleLabel(bundle)} · ${bundle.days}d`,
        salePriceMinor: iqdAmount(bundle.usd, bundle.saleIqdMinor),
        user: { phone: user.phone, name: user.name, email: user.email ?? null },
      });
      setResult({
        providerOrderNo: res.providerOrderNo ?? res.orderNo ?? null,
        orderItemId: res.database?.orderItemId ?? null,
      });
      try {
        await notifyCustomer(user, place);
      } catch {
        // Swallowed on purpose — see notifyCustomer.
      }
    } catch (e: any) {
      setError(e?.message || tr('common.somethingWrong'));
    } finally {
      setSubmitting(false);
    }
  }, [
    selectedUser,
    selectedBundle,
    selectedPlace,
    tr,
    priceLabel,
    bundleLabel,
    iqdAmount,
    notifyCustomer,
  ]);

  const filteredPlaces = useMemo(() => {
    // Resolve display names before filtering, so searching "Germany" matches a
    // featured row whose stored name is only "DE". A name an admin actually
    // typed wins; only the code-as-name placeholders get replaced.
    const named = places.map((p) => {
      const stored = (p.name ?? '').trim();
      const isPlaceholder = !stored || stored.toUpperCase() === p.code.toUpperCase();
      return {
        ...p,
        name: isPlaceholder ? nameByCode[p.code.toUpperCase()] ?? p.code : stored,
      };
    });
    const q = placeSearch.trim().toLowerCase();
    if (!q) return named;
    return named.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
    );
  }, [places, placeSearch, nameByCode]);

  return {
    isAdmin,
    isWide,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/admin')),
    goOrders: () => router.push('/admin/orders'),

    search,
    setSearch,
    users,
    loadingUsers,
    selectedUser,
    selectUser: setSelectedUser,

    tab,
    setTab,
    places: filteredPlaces,
    loadingPlaces,
    selectedPlace,
    selectPlace: setSelectedPlace,
    placeSearch,
    setPlaceSearch,
    groups,
    loadingBundles,
    bundlesError,
    selectedBundle,
    selectBundle: setSelectedBundle,
    priceLabel,
    bundleLabel,

    summaryPrice,
    duplicateWarning,
    canSubmit,
    submitting,
    error,
    result,
    submit,
    reset,
  };
}
