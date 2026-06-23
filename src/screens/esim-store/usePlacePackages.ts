import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMoney } from '@/lib/money';
import { useIsWideWeb } from '@/lib/responsive';
import { packagesToBundles } from '@/lib/catalog';
import { queryPackages, getCountries, cachedCountries } from '@/services/esim';
import type { Bundle } from '@/data/esim';
import { useEsimCart } from '@/state/esimCart';

export type PlacePackagesGroup = { days: number; items: Bundle[] };

export type PlacePackagesViewModel = {
  isRegion: boolean;
  isWide: boolean;
  name: string;
  iso: string | undefined;
  loading: boolean;
  groups: PlacePackagesGroup[];
  coverage: string[];
  nameByCode: Record<string, string>;
  coverageOpen: boolean;
  setCoverageOpen: (open: boolean) => void;
  selected: Bundle | null;
  setSelected: (bundle: Bundle | null) => void;
  money: ReturnType<typeof useMoney>;
  goBack: () => void;
  onContinue: () => void;
};

export function usePlacePackages(): PlacePackagesViewModel {
  const { place, region, name: nameParam } = useLocalSearchParams<{ place: string; region?: string; name?: string }>();
  const router = useRouter();
  const money = useMoney();
  const select = useEsimCart((s) => s.select);

  const isRegion = region === '1';
  const isWide = useIsWideWeb();
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  // For regions: the ISO codes this region's plans actually cover, and a
  // code -> full-name map so we can show "Germany" instead of "DE".
  const [coverage, setCoverage] = useState<string[]>([]);
  const [nameByCode, setNameByCode] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const c of cachedCountries()) m[c.code.toUpperCase()] = c.name;
    return m;
  });

  const name = nameParam || (place as string) || 'eSIM';
  const iso = isRegion ? undefined : String(place || '').toUpperCase();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/esim-store');
  };

  useEffect(() => {
    let cancelled = false;
    const locationCode = (iso ?? String(place || '')).toUpperCase();
    setLoading(true);
    queryPackages({ locationCode })
      .then((pkgs) => {
        if (cancelled) return;
        setBundles(packagesToBundles(pkgs, place as string, { countryCode: isRegion ? undefined : locationCode }));
        if (isRegion) {
          // Union of every covered country across this region's plans.
          const codes = new Set<string>();
          for (const p of pkgs) {
            String(p.location ?? '')
              .split(',')
              .map((s) => s.trim().toUpperCase())
              .filter(Boolean)
              .forEach((c) => codes.add(c));
          }
          setCoverage([...codes].sort());
        }
      })
      .catch(() => {
        if (!cancelled) setBundles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [iso, place]);

  // Resolve ISO codes to full country names for the coverage list (regions only).
  useEffect(() => {
    if (!isRegion) return;
    getCountries()
      .then((cs) => {
        const m: Record<string, string> = {};
        for (const c of cs) m[c.code.toUpperCase()] = c.name;
        setNameByCode(m);
      })
      .catch(() => {});
  }, [isRegion]);

  // Group plans by duration, ascending (1-day plans, then 7-day, etc.).
  const groups = useMemo(() => {
    const m = new Map<number, Bundle[]>();
    for (const b of bundles) {
      const arr = m.get(b.days) ?? [];
      arr.push(b);
      m.set(b.days, arr);
    }
    return [...m.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([days, items]) => ({ days, items: items.sort((x, y) => x.usd - y.usd) }));
  }, [bundles]);

  const onContinue = () => {
    if (!selected) return;
    select({ id: place as string, name, iso, isRegion }, selected);
    router.push('/esim-store/checkout');
  };

  return {
    isRegion,
    isWide,
    name,
    iso,
    loading,
    groups,
    coverage,
    nameByCode,
    coverageOpen,
    setCoverageOpen,
    selected,
    setSelected,
    money,
    goBack,
    onContinue,
  };
}
