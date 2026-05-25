import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Globe, Check, Infinity as InfinityIcon, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PressableScale } from '@/components/PressableScale';
import { useMoney } from '@/lib/money';
import {
  ESIM_COUNTRIES,
  ESIM_REGIONS,
  bundlesFor,
  type Bundle,
} from '@/data/esim';
import { useEsimCart } from '@/state/esimCart';

type PlanType = 'fixed' | 'unlimited';

export default function PlaceDetail() {
  const { place, region } = useLocalSearchParams<{ place: string; region?: string }>();
  const t = useTheme();
  const router = useRouter();
  const money = useMoney();
  const select = useEsimCart((s) => s.select);

  const isRegion = region === '1';
  const [type, setType] = useState<PlanType>('fixed');
  const [coverageOpen, setCoverageOpen] = useState(false);

  const regionData = isRegion ? ESIM_REGIONS.find((r) => r.id === place) : undefined;
  const countryData = !isRegion ? ESIM_COUNTRIES.find((c) => c.iso === place) : undefined;

  const name = regionData?.name ?? countryData?.name ?? 'eSIM';
  const base = regionData?.fromUsd ?? countryData?.fromUsd ?? 5;
  const iso = countryData?.iso;

  const bundles = useMemo(() => bundlesFor(place as string, base, type), [place, base, type]);

  const onSelect = (b: Bundle) => {
    select({ id: place as string, name, iso, isRegion }, b);
    router.push('/esim-store/checkout');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {iso ? <Flag iso={iso} size={30} /> : <Globe size={24} color={t.primary} strokeWidth={2} />}
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            {name}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14, maxWidth: 780, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Region coverage */}
        {isRegion && regionData && (
          <PressableScale
            onPress={() => setCoverageOpen(true)}
            scaleTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 14,
              backgroundColor: t.brand.blue50,
              borderWidth: 1,
              borderColor: t.brand.blue100,
            }}
          >
            <Globe size={20} color={t.primary} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.brand.blue800 }}>
                Coverage in {regionData.countries.length}+ countries
              </Text>
              <Text style={{ fontSize: 12, color: t.brand.blue700, marginTop: 1 }}>
                Tap to see where this eSIM works
              </Text>
            </View>
            <Check size={18} color={t.primary} />
          </PressableScale>
        )}

        {/* Plan type toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: t.bgSunken, borderRadius: 12, padding: 4 }}>
          {(['fixed', 'unlimited'] as PlanType[]).map((id) => {
            const on = id === type;
            return (
              <Pressable
                key={id}
                onPress={() => setType(id)}
                style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: on ? t.bgElev : 'transparent', ...(on ? t.shadow1 : {}) }}
              >
                <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 13, color: on ? t.fg : t.fgMuted }}>
                  {id === 'fixed' ? 'Fixed data' : 'Unlimited'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bundles */}
        <View style={{ gap: 10 }}>
          {bundles.map((b) => (
            <PressableScale
              key={b.id}
              onPress={() => onSelect(b)}
              scaleTo={0.98}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: 16,
                backgroundColor: t.bgElev,
                borderWidth: b.popular ? 1.5 : 1,
                borderColor: b.popular ? t.primary : t.border,
                ...t.shadow1,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {b.type === 'unlimited' ? (
                  <InfinityIcon size={22} color="#10B981" strokeWidth={2.2} />
                ) : (
                  <Text style={{ fontFamily: t.font.display, fontWeight: '800', fontSize: 15, color: '#10B981' }}>
                    {b.gb}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                    {b.type === 'unlimited' ? 'Unlimited' : `${b.gb} GB`}
                  </Text>
                  {b.popular && (
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(25,103,210,0.12)' }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: t.primary, letterSpacing: 0.4 }}>POPULAR</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>Valid for {b.days} days</Text>
              </View>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                {money(b.usd)}
              </Text>
            </PressableScale>
          ))}
        </View>
      </ScrollView>

      {/* Coverage modal */}
      <Modal visible={coverageOpen} transparent animationType="slide" onRequestClose={() => setCoverageOpen(false)}>
        <Pressable
          onPress={() => setCoverageOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        >
          <Pressable
            style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '76%' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                Coverage — {regionData?.name}
              </Text>
              <Pressable onPress={() => setCoverageOpen(false)}>
                <X size={20} color={t.fgMuted} />
              </Pressable>
            </View>
            <Text style={{ fontSize: 12, color: t.fgMuted, marginBottom: 12 }}>
              You'll have coverage in these countries as well:
            </Text>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {regionData?.countries.map((c) => (
                <View
                  key={c}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    backgroundColor: t.bgSunken,
                  }}
                >
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
