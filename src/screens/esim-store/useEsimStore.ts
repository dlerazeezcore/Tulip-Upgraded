import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useIsWideWeb } from '@/lib/responsive';
import { getFeaturedLocations, getCountries, getRegions, cachedCountries, type LocationCountry, type ProviderRegion } from '@/services/esim';
import type { FeaturedLocation } from '@/services/types';

export type Tab = 'popular' | 'countries' | 'regions';
const TAB_IDS: Tab[] = ['popular', 'countries', 'regions'];

// Fixed-height rows let FlatList skip layout measurement → faster scroll.
const COUNTRY_ROW_HEIGHT = 52;

export interface EsimStoreVM {
  isWide: boolean;
  tab: Tab;
  setTab: (tab: Tab) => void;
  tabs: { id: Tab; label: string }[];
  q: string;
  setQ: (q: string) => void;
  popular: (FeaturedLocation & { displayName: string })[];
  regions: ProviderRegion[];
  loadingCountries: boolean;
  /** First fetch still in flight — show a skeleton, never an empty state. */
  popularLoading: boolean;
  regionsLoading: boolean;
  filteredCountries: LocationCountry[];
  /** Fetch failed with nothing cached to show — render ErrorState, not "no data". */
  popularErrored: boolean;
  countriesErrored: boolean;
  regionsErrored: boolean;
  retry: () => void;
  getCountryItemLayout: (_: unknown, index: number) => { length: number; offset: number; index: number };
  goBack: () => void;
  openPlace: (code: string, name: string) => void;
  openRegion: (code: string, name: string) => void;
}

export function useEsimStore(): EsimStoreVM {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const isWide = useIsWideWeb();
  const [tab, setTab] = useState<Tab>('popular');
  const [q, setQ] = useState('');
  const [popular, setPopular] = useState<FeaturedLocation[]>([]);
  const [countries, setCountries] = useState<LocationCountry[]>(cachedCountries());
  const [regions, setRegions] = useState<ProviderRegion[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(cachedCountries().length === 0);
  const [popularLoading, setPopularLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(true);
  // Track failures separately from data: a failed fetch must render as an
  // error with retry, never as an empty catalog (audit #2).
  const [popularFailed, setPopularFailed] = useState(false);
  const [countriesFailed, setCountriesFailed] = useState(false);
  const [regionsFailed, setRegionsFailed] = useState(false);

  const load = useCallback(() => {
    setLoadingCountries(cachedCountries().length === 0);
    setPopularLoading(true);
    setRegionsLoading(true);
    getFeaturedLocations('esim')
      .then((v) => { setPopular(v); setPopularFailed(false); })
      .catch(() => setPopularFailed(true))
      .finally(() => setPopularLoading(false));
    getRegions()
      .then((v) => { setRegions(v); setRegionsFailed(false); })
      .catch(() => setRegionsFailed(true))
      .finally(() => setRegionsLoading(false));
    getCountries()
      .then((v) => { setCountries(v); setCountriesFailed(false); })
      .catch(() => setCountriesFailed(true))
      .finally(() => setLoadingCountries(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/services');
  };
  const openPlace = (code: string, name: string) =>
    router.push(`/esim-store/${code}?name=${encodeURIComponent(name)}`);
  const openRegion = (code: string, name: string) =>
    router.push(`/esim-store/${code}?region=1&name=${encodeURIComponent(name)}`);

  // Resolve full country names (provider list) for popular codes like "TR" -> "Türkiye".
  const nameByCode = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of countries) m[c.code] = c.name;
    return m;
  }, [countries]);

  // Popular rows arrive from the backend sometimes carrying a bare ISO code as
  // the name — resolve it to the provider's full country name for display.
  const popularView = useMemo(
    () =>
      popular.map((c) => {
        const isCode = /^[A-Za-z]{2}$/.test((c.name ?? '').trim());
        return { ...c, displayName: isCode ? (nameByCode[c.code.toUpperCase()] ?? c.name) : c.name };
      }),
    [popular, nameByCode],
  );

  const tabs = TAB_IDS.map((id) => ({
    id,
    label: tr(`esimStore.tab${id.charAt(0).toUpperCase()}${id.slice(1)}`),
  }));

  const query = q.trim().toLowerCase();
  const filteredCountries = useMemo(
    () =>
      query
        ? countries.filter((c) => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query))
        : countries,
    [countries, query],
  );

  // Fixed-height rows let FlatList skip layout measurement → faster scroll.
  const getCountryItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: COUNTRY_ROW_HEIGHT, offset: COUNTRY_ROW_HEIGHT * index, index }),
    [],
  );

  return {
    isWide,
    tab,
    setTab,
    tabs,
    q,
    setQ,
    popular: popularView,
    regions,
    loadingCountries,
    popularLoading,
    regionsLoading,
    filteredCountries,
    // Errored only when there is nothing (not even a cache) to show — stale
    // data with a failed background refresh still renders the data.
    popularErrored: popularFailed && popular.length === 0,
    countriesErrored: countriesFailed && countries.length === 0,
    regionsErrored: regionsFailed && regions.length === 0,
    retry: load,
    getCountryItemLayout,
    goBack,
    openPlace,
    openRegion,
  };
}
