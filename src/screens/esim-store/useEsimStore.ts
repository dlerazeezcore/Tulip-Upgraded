import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useIsWideWeb } from '@/lib/responsive';
import { getFeaturedLocations, getCountries, getRegions, cachedCountries, type LocationCountry, type ProviderRegion } from '@/services/esim';
import type { FeaturedLocation } from '@/services/types';

export type Tab = 'popular' | 'countries' | 'regions';
export const TABS: { id: Tab; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'countries', label: 'Countries' },
  { id: 'regions', label: 'Regions' },
];

// Fixed-height rows let FlatList skip layout measurement → faster scroll.
const COUNTRY_ROW_HEIGHT = 52;

export interface EsimStoreVM {
  isWide: boolean;
  tab: Tab;
  setTab: (tab: Tab) => void;
  q: string;
  setQ: (q: string) => void;
  popular: FeaturedLocation[];
  regions: ProviderRegion[];
  loadingCountries: boolean;
  filteredCountries: LocationCountry[];
  nameByCode: Record<string, string>;
  getCountryItemLayout: (_: unknown, index: number) => { length: number; offset: number; index: number };
  goBack: () => void;
  openPlace: (code: string, name: string) => void;
  openRegion: (code: string, name: string) => void;
}

export function useEsimStore(): EsimStoreVM {
  const router = useRouter();
  const isWide = useIsWideWeb();
  const [tab, setTab] = useState<Tab>('popular');
  const [q, setQ] = useState('');
  const [popular, setPopular] = useState<FeaturedLocation[]>([]);
  const [countries, setCountries] = useState<LocationCountry[]>(cachedCountries());
  const [regions, setRegions] = useState<ProviderRegion[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(cachedCountries().length === 0);

  useEffect(() => {
    getFeaturedLocations('esim').then(setPopular).catch(() => setPopular([]));
    getRegions().then(setRegions).catch(() => setRegions([]));
    getCountries()
      .then(setCountries)
      .catch(() => setCountries([]))
      .finally(() => setLoadingCountries(false));
  }, []);

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
    q,
    setQ,
    popular,
    regions,
    loadingCountries,
    filteredCountries,
    nameByCode,
    getCountryItemLayout,
    goBack,
    openPlace,
    openRegion,
  };
}
