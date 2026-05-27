import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Search, Globe } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PressableScale } from '@/components/PressableScale';
import { useIsWideWeb } from '@/lib/responsive';
import { getFeaturedLocations, getCountries, getRegions, type LocationCountry, type ProviderRegion } from '@/services/esim';
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
  const [countries, setCountries] = useState<LocationCountry[]>([]);
  const [regions, setRegions] = useState<ProviderRegion[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
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

      <ScrollView
        contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 40, gap: 16, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        {tab === 'popular' && (
          <View style={{ gap: 10 }}>
            {popular.length === 0 ? (
              <Text style={{ fontSize: 13, color: t.fgMuted }}>No popular destinations set. Use the Countries tab.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: isWide ? -5 : 0, gap: isWide ? 0 : 10 }}>
                {popular.map((c) => {
                  const full = nameByCode[c.code.toUpperCase()] ?? c.name;
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

        {tab === 'countries' && (
          <>
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
            {loadingCountries ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
            ) : (
              <View style={{ backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
                {filteredCountries.map((c, i) => (
                  <Pressable
                    key={c.code}
                    onPress={() => openPlace(c.code, c.name)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: i === filteredCountries.length - 1 ? 0 : 1, borderBottomColor: t.border }}
                  >
                    <Flag iso={c.code} size={28} />
                    <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 14, color: t.fg }}>{c.name}</Text>
                    <ChevronRight size={16} color={t.fgFaint} />
                  </Pressable>
                ))}
                {filteredCountries.length === 0 && (
                  <Text style={{ color: t.fgMuted, textAlign: 'center', padding: 20 }}>No countries match "{q}"</Text>
                )}
              </View>
            )}
          </>
        )}

        {tab === 'regions' && (
          regions.length === 0 ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
          ) : (
            <View style={{ backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
              {regions.map((r, i) => (
                <Pressable
                  key={r.code}
                  onPress={() => router.push(`/esim-store/${r.code}?region=1&name=${encodeURIComponent(r.name)}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: i === regions.length - 1 ? 0 : 1, borderBottomColor: t.border }}
                >
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={18} color={t.primary} strokeWidth={2} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 14, color: t.fg }}>{r.name}</Text>
                  <ChevronRight size={16} color={t.fgFaint} />
                </Pressable>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
