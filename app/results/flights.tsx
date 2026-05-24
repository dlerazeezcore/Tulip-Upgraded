import React, { useMemo } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { FLIGHTS } from '@/data/flights';
import { useFiltersStore } from '@/state/filtersStore';
import { useSearchStore } from '@/state/searchStore';
import { FlightCard } from '@/components/FlightCard';

const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price',       label: 'Cheapest'    },
  { id: 'duration',    label: 'Quickest'    },
] as const;

export default function FlightResults() {
  const t = useTheme();
  const router = useRouter();
  const sort = useFiltersStore((s) => s.flightSort);
  const setSort = useFiltersStore((s) => s.setFlightSort);
  const { from, to, departDate, returnDate, tripType } = useSearchStore();

  const sorted = useMemo(() => {
    const list = [...FLIGHTS];
    if (sort === 'price') list.sort((a, b) => a.price - b.price);
    else if (sort === 'duration') list.sort((a, b) => a.duration.localeCompare(b.duration));
    return list;
  }, [sort]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.bgSunken,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>
            {from.split(' · ')[0]} → {to.split(' · ')[0]}
          </Text>
          <Text style={{ fontSize: 11, color: t.fgMuted }}>
            {departDate}
            {tripType === 'roundtrip' ? ` – ${returnDate}` : ''} · {sorted.length} flights
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12, maxWidth: 1100, width: '100%', alignSelf: 'center' }}
      >
        {/* Sort tabs */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {SORTS.map((s) => {
            const on = s.id === sort;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSort(s.id)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: on ? t.primary : t.bgSunken,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    fontFamily: t.font.displayMedium,
                    color: on ? '#fff' : t.fgMuted,
                  }}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {sorted.map((f) => (
          <FlightCard key={f.id} flight={f} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
