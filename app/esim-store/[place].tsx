import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Globe, Check, Infinity as InfinityIcon, X, ArrowRight, Clock } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useIqdMoney } from '@/lib/pricing';
import { useIsWideWeb } from '@/lib/responsive';
import { packagesToBundles } from '@/lib/catalog';
import { queryPackages } from '@/services/esim';
import { ESIM_COUNTRIES, ESIM_REGIONS, type Bundle } from '@/data/esim';
import { useEsimCart } from '@/state/esimCart';

export default function PlaceDetail() {
  const { place, region, name: nameParam } = useLocalSearchParams<{ place: string; region?: string; name?: string }>();
  const t = useTheme();
  const router = useRouter();
  const money = useIqdMoney();
  const select = useEsimCart((s) => s.select);

  const isRegion = region === '1';
  const isWide = useIsWideWeb();
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  const regionData = isRegion ? ESIM_REGIONS.find((r) => r.id === place) : undefined;
  const countryData = !isRegion ? ESIM_COUNTRIES.find((c) => c.iso === place) : undefined;
  const name = nameParam || regionData?.name || countryData?.name || (place as string) || 'eSIM';
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
        if (!cancelled) {
          setBundles(packagesToBundles(pkgs, place as string, { countryCode: isRegion ? undefined : locationCode }));
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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={goBack}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {iso ? <Flag iso={iso} size={30} /> : <Globe size={24} color={t.primary} strokeWidth={2} />}
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>{name}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 120, gap: 16, maxWidth: isWide ? 960 : 780, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {isRegion && regionData && (
          <PressableScale
            onPress={() => setCoverageOpen(true)}
            scaleTo={0.98}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: t.brand.blue50, borderWidth: 1, borderColor: t.brand.blue100 }}
          >
            <Globe size={20} color={t.primary} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.brand.blue800 }}>
                Coverage in {regionData.countries.length}+ countries
              </Text>
              <Text style={{ fontSize: 12, color: t.brand.blue700, marginTop: 1 }}>Tap to see where this eSIM works</Text>
            </View>
            <Check size={18} color={t.primary} />
          </PressableScale>
        )}

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={t.primary} />
          </View>
        ) : groups.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ color: t.fgMuted }}>No plans available for {name}.</Text>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.days} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
                    backgroundColor: t.brand.blue50, borderWidth: 1, borderColor: t.brand.blue100,
                  }}
                >
                  <Clock size={13} color={t.primary} strokeWidth={2.4} />
                  <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '800', fontSize: 12, color: t.primary, letterSpacing: 0.3 }}>
                    {g.days === 1 ? '1 DAY' : `${g.days} DAYS`}
                  </Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: isWide ? -5 : 0, gap: isWide ? 0 : 10 }}>
                {g.items.map((b) => {
                  const isSelected = selected?.id === b.id;
                  return (
                    <View key={b.id} style={{ width: isWide ? '50%' : '100%', padding: isWide ? 5 : 0 }}>
                      <PressableScale
                        onPress={() => setSelected(b)}
                        scaleTo={0.98}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16,
                          backgroundColor: t.bgElev, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? t.primary : t.border, ...t.shadow1,
                        }}
                      >
                        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                          {b.type === 'unlimited' ? (
                            <InfinityIcon size={22} color="#10B981" strokeWidth={2.2} />
                          ) : (
                            <Text style={{ fontFamily: t.font.display, fontWeight: '800', fontSize: 15, color: '#10B981' }}>{b.gb}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                            {b.type === 'unlimited' ? 'Unlimited' : `${b.gb} GB`}
                          </Text>
                          <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>Valid for {b.days} days</Text>
                        </View>
                        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>{money(b.usd)}</Text>
                        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: isSelected ? t.primary : t.borderStrong, backgroundColor: isSelected ? t.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                        </View>
                      </PressableScale>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {selected && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 28, backgroundColor: t.bgElev, borderTopWidth: 1, borderTopColor: t.border }}>
          <View style={{ maxWidth: 780, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: t.fgMuted }}>
                {selected.type === 'unlimited' ? 'Unlimited' : `${selected.gb} GB`} · {selected.days} days
              </Text>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{money(selected.usd)}</Text>
            </View>
            <PrimaryButton label="Continue" icon={<ArrowRight size={16} color="#fff" strokeWidth={2.2} />} onPress={onContinue} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      <Modal visible={coverageOpen} transparent animationType="slide" onRequestClose={() => setCoverageOpen(false)}>
        <Pressable onPress={() => setCoverageOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '76%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>Coverage — {regionData?.name}</Text>
              <Pressable onPress={() => setCoverageOpen(false)}><X size={20} color={t.fgMuted} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {regionData?.countries.map((c) => (
                <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, backgroundColor: t.bgSunken }}>
                  <Flag iso={c} size={18} />
                  <Text style={{ fontSize: 12, color: t.fg, fontWeight: '600' }}>{c}</Text>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
