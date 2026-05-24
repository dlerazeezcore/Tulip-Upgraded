import React, { useMemo } from 'react';
import { ScrollView, View, Text, Pressable, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Star, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { HOTELS, Hotel } from '@/data/hotels';
import { useFiltersStore } from '@/state/filtersStore';
import { Checkbox } from '@/components/Checkbox';
import { HotelCard } from '@/components/HotelCard';
import { useSearchStore } from '@/state/searchStore';

const SORTS = ['Recommended', 'Price', 'Rating'] as const;

function FilterRail() {
  const t = useTheme();
  const { hotelStars, hotelAmenities, toggleStar, toggleAmenity } = useFiltersStore();
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Filters
      </Text>

      <View style={{ padding: 14, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 12 }}>
        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 13, color: t.fg }}>
          Price / night
        </Text>
        <Text style={{ fontSize: 11, color: t.fgMuted, marginTop: 4 }}>$120 – $1,200</Text>
        <View style={{ height: 4, backgroundColor: t.bgSunken, borderRadius: 2, marginTop: 8 }}>
          <View style={{ position: 'absolute', left: '15%', right: '25%', top: 0, height: 4, backgroundColor: t.primary, borderRadius: 2 }} />
        </View>
      </View>

      <View style={{ padding: 14, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 12 }}>
        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 13, color: t.fg, marginBottom: 8 }}>
          Star rating
        </Text>
        {[5, 4, 3].map((s) => (
          <Pressable
            key={s}
            onPress={() => toggleStar(s)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}
          >
            <Checkbox checked={!!hotelStars[s]} onChange={() => toggleStar(s)} />
            <View style={{ flexDirection: 'row', gap: 1 }}>
              {Array(s)
                .fill(0)
                .map((_, i) => (
                  <Star key={i} size={11} color="#F59E0B" fill="#F59E0B" />
                ))}
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ padding: 14, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 12 }}>
        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 13, color: t.fg, marginBottom: 8 }}>
          Amenities
        </Text>
        {(['wifi', 'pool', 'gym', 'breakfast'] as const).map((a) => (
          <Pressable
            key={a}
            onPress={() => toggleAmenity(a)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}
          >
            <Checkbox checked={hotelAmenities[a]} onChange={() => toggleAmenity(a)} />
            <Text style={{ fontSize: 13, color: t.fg, textTransform: 'capitalize' }}>{a === 'wifi' ? 'Wi-Fi' : a}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function HotelResults() {
  const t = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= 900;
  const { hotelStars, hotelAmenities, flightSort, setFlightSort } = useFiltersStore();
  const departDate = useSearchStore((s) => s.departDate);
  const returnDate = useSearchStore((s) => s.returnDate);
  const [showFilters, setShowFilters] = React.useState(false);

  const filtered = useMemo<Hotel[]>(() => {
    const activeStars = Object.entries(hotelStars)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));
    const activeAmenities = Object.entries(hotelAmenities)
      .filter(([_, v]) => v)
      .map(([k]) => k as keyof typeof hotelAmenities);
    return HOTELS.filter(
      (h) =>
        (activeStars.length === 0 || activeStars.includes(h.stars)) &&
        (activeAmenities.length === 0 ||
          activeAmenities.every((a) => h.amenities.includes(a as any))),
    );
  }, [hotelStars, hotelAmenities]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>
            London hotels
          </Text>
          <Text style={{ fontSize: 11, color: t.fgMuted }}>
            {departDate} – {returnDate} · {filtered.length} properties
          </Text>
        </View>
        {!wide && (
          <Pressable
            onPress={() => setShowFilters((v) => !v)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: showFilters ? t.primary : t.bgSunken,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SlidersHorizontal size={16} color={showFilters ? '#fff' : t.fg} />
          </Pressable>
        )}
      </View>

      {wide ? (
        <View style={{ flex: 1, flexDirection: 'row', maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
          <ScrollView style={{ width: 260 }} contentContainerStyle={{ padding: 20 }}>
            <FilterRail />
          </ScrollView>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}>
            <SortTabs value={flightSort} onChange={setFlightSort} />
            {filtered.map((h) => (
              <HotelCard key={h.id} hotel={h} />
            ))}
            {filtered.length === 0 && (
              <Text style={{ color: t.fgMuted, textAlign: 'center', marginTop: 40 }}>
                No hotels match your filters
              </Text>
            )}
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}>
          {showFilters && <FilterRail />}
          <SortTabs value={flightSort} onChange={setFlightSort} />
          {filtered.map((h) => (
            <HotelCard key={h.id} hotel={h} />
          ))}
          {filtered.length === 0 && (
            <Text style={{ color: t.fgMuted, textAlign: 'center', marginTop: 40 }}>
              No hotels match your filters
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SortTabs({
  value,
  onChange,
}: {
  value: 'recommended' | 'price' | 'duration';
  onChange: (v: 'recommended' | 'price' | 'duration') => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.bgSunken,
        borderRadius: 10,
        padding: 3,
        alignSelf: 'flex-end',
      }}
    >
      {SORTS.map((s) => {
        const key = s.toLowerCase() as 'recommended' | 'price' | 'duration';
        const on = value === key || (key === 'duration' && value === 'duration');
        return (
          <Pressable
            key={s}
            onPress={() => onChange(key)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 8,
              backgroundColor: on ? t.bgElev : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                fontFamily: t.font.displayMedium,
                color: on ? t.fg : t.fgMuted,
              }}
            >
              {s}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
