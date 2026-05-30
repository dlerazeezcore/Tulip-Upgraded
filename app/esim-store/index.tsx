import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Search, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PressableScale } from '@/components/PressableScale';

// Distinct, vibrant gradients so the Regions grid looks polished without
// needing a photo per region (the provider gives no region imagery).
const REGION_GRADIENTS: [string, string][] = [
  ['#1967D2', '#0B4FB0'], ['#10B981', '#047857'], ['#7C3AED', '#5B21B6'],
  ['#F59E0B', '#B45309'], ['#EC4899', '#9D174D'], ['#0EA5E9', '#0369A1'],
  ['#EF4444', '#991B1B'], ['#14B8A6', '#0F766E'],
];
import { useIsWideWeb } from '@/lib/responsive';
import { getFeaturedLocations, getCountries, getRegions, cachedCountries, type LocationCountry, type ProviderRegion } from '@/services/esim';
import type { FeaturedLocation } from '@/services/types';

type Tab = 'popular' | 'countries' | 'regions';
const TABS: { id: Tab; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'countries', label: 'Countries' },
  { id: 'regions', label: 'Regions' },
];

export default function EsimStore() {
  const t = useTheme();
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

  // Memoized renderItem for the countries FlatList — prevents recreating closures
  // on every re-render, lets RN bail out of re-rendering rows whose data unchanged.
  const renderCountryRow = useCallback(
    ({ item, index }: { item: LocationCountry; index: number }) => (
      <Pressable
        onPress={() => openPlace(item.code, item.name)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderBottomWidth: index === filteredCountries.length - 1 ? 0 : 1,
          borderBottomColor: t.border,
        }}
      >
        <Flag iso={item.code} size={28} />
        <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 14, color: t.fg }}>{item.name}</Text>
        <ChevronRight size={16} color={t.fgFaint} />
      </Pressable>
    ),
    [filteredCountries.length, t.border, t.fg, t.fgFaint, t.font.displayMedium],
  );

  // Fixed-height rows let FlatList skip layout measurement → faster scroll.
  const COUNTRY_ROW_HEIGHT = 52;
  const getCountryItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: COUNTRY_ROW_HEIGHT, offset: COUNTRY_ROW_HEIGHT * index, index }),
    [],
  );

  // Shared header: back button + title. Renders for every tab.
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
      <Pressable
        onPress={goBack}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronLeft size={18} color={t.fg} />
      </Pressable>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Globe size={20} color="#10B981" strokeWidth={2} />
        <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>eSIM Store</Text>
      </View>
    </View>
  );

  // Tab switcher — used by all three tabs (as ScrollView child OR FlatList ListHeader).
  const tabSwitcher = (
    <View style={{ flexDirection: 'row', backgroundColor: t.bgSunken, borderRadius: 12, padding: 4 }}>
      {TABS.map((tb) => {
        const on = tb.id === tab;
        return (
          <Pressable
            key={tb.id}
            onPress={() => setTab(tb.id)}
            style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: on ? t.bgElev : 'transparent', ...(on ? t.shadow1 : {}) }}
          >
            <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 13, color: on ? t.fg : t.fgMuted }}>
              {tb.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // ─── Countries tab ─── uses FlatList (virtualized; only visible rows render),
  // because the provider list is 200+ items and rendering all of them via .map()
  // inside a ScrollView froze the JS thread (could not tap rows, app crashed).
  if (tab === 'countries') {
    const listHeader = (
      <View style={{ padding: isWide ? 28 : 20, paddingBottom: 16, gap: 16, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center' }}>
        {tabSwitcher}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: t.bgSunken }}>
          <Search size={18} color={t.fgMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search any country"
            placeholderTextColor={t.fgFaint}
            autoCapitalize="none"
            style={{ flex: 1, fontSize: 14, color: t.fg, fontFamily: t.font.bodyMedium, paddingVertical: 2 }}
          />
        </View>
      </View>
    );
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
        {header}
        {loadingCountries ? (
          <>
            {listHeader}
            <View style={{ paddingVertical: 30, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
          </>
        ) : (
          <FlatList
            data={filteredCountries}
            keyExtractor={(c) => c.code}
            renderItem={renderCountryRow}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <Text style={{ color: t.fgMuted, textAlign: 'center', padding: 20 }}>
                {query ? `No countries match "${q}"` : 'No countries available.'}
              </Text>
            }
            getItemLayout={getCountryItemLayout}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: isWide ? 28 : 20, paddingBottom: 40, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center', backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden', marginHorizontal: isWide ? 28 : 20 }}
            style={{ flex: 1 }}
          />
        )}
      </SafeAreaView>
    );
  }

  // ─── Popular + Regions ─── small lists; ScrollView is fine.
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      {header}
      <ScrollView
        contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 40, gap: 16, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tabSwitcher}

        {tab === 'popular' && (
          <View style={{ gap: 10 }}>
            {popular.length === 0 ? (
              <Text style={{ fontSize: 13, color: t.fgMuted }}>No popular destinations set. Use the Countries tab.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: isWide ? -5 : 0, gap: isWide ? 0 : 10 }}>
                {popular.map((c) => {
                  const isCode = /^[A-Za-z]{2}$/.test((c.name ?? '').trim());
                  const full = isCode ? (nameByCode[c.code.toUpperCase()] ?? c.name) : c.name;
                  return (
                    <View key={c.code} style={{ width: isWide ? '50%' : '100%', padding: isWide ? 5 : 0 }}>
                      <PressableScale
                        onPress={() => openPlace(c.code, full)}
                        scaleTo={0.98}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}
                      >
                        <Flag iso={c.code} size={34} />
                        <Text style={{ flex: 1, fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>{full}</Text>
                        <ChevronRight size={20} color={t.fgFaint} />
                      </PressableScale>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {tab === 'regions' && (
          regions.length === 0 ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
              {regions.map((r, idx) => {
                const g = REGION_GRADIENTS[idx % REGION_GRADIENTS.length];
                return (
                  <View key={r.code} style={{ width: isWide ? '33.333%' : '50%', padding: 5 }}>
                    <PressableScale
                      onPress={() => router.push(`/esim-store/${r.code}?region=1&name=${encodeURIComponent(r.name)}`)}
                      scaleTo={0.97}
                    >
                      <LinearGradient
                        colors={g}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ borderRadius: 16, padding: 14, minHeight: 116, justifyContent: 'space-between', ...t.shadow1 }}
                      >
                        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                          <Globe size={20} color="#fff" strokeWidth={2.2} />
                        </View>
                        <View style={{ marginTop: 10 }}>
                          <Text numberOfLines={2} style={{ fontFamily: t.font.display, fontWeight: '800', fontSize: 15, color: '#fff' }}>{r.name}</Text>
                          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Multi-country eSIM</Text>
                        </View>
                      </LinearGradient>
                    </PressableScale>
                  </View>
                );
              })}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
