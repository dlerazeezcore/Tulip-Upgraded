// THIN UI — wiring lives in src/screens/search/useServiceSearch.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpDown,
  Minus,
  Plus,
  Search as SearchIcon,
  User,
} from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { MultiServiceTabs } from '@/components/MultiServiceTabs';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useServiceSearch } from '@/screens/search/useServiceSearch';
import { useIsWideWeb } from '@/lib/responsive';

const TRIP_TYPES = [
  { id: 'roundtrip', labelKey: 'search.roundTrip' },
  { id: 'oneway',    labelKey: 'search.oneWay' },
] as const;

function Stepper({
  label,
  value,
  unit,
  onDec,
  onInc,
}: {
  label: string;
  value: number;
  unit: string;
  onDec: () => void;
  onInc: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View
      style={{
        padding: 14,
        backgroundColor: t.bgElev,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <User size={18} color={t.fgMuted} />
        <View>
          <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {label}
          </Text>
          <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 15, color: t.fg }}>
            {value} {unit}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          onPress={onDec}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.decrease')}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <Minus size={14} color={t.fg} />
        </Pressable>
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, minWidth: 18, textAlign: 'center', color: t.fg }}>
          {value}
        </Text>
        <Pressable
          onPress={onInc}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.increase')}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={14} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useServiceSearch();
  const svc = vm.svc;
  const isWide = useIsWideWeb();

  // Form pieces defined once, then composed differently per breakpoint:
  // a single stacked column on mobile/native (unchanged), or two columns on
  // desktop web (From/To + dates left, trip-type + steppers right).
  const tripTypePills =
    svc.id === 'flights' ? (
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {TRIP_TYPES.map((tt) => {
          const on = tt.id === vm.tripType;
          return (
            <Pressable
              key={tt.id}
              onPress={() => vm.setTripType(tt.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? t.primary : t.bgSunken }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: t.font.displayMedium, color: on ? '#fff' : t.fgMuted }}>
                {tr(tt.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    ) : null;

  const fromToCard = (
    <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, padding: 14 }}>
          <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {svc.id === 'hotels' ? tr('search.destination') : tr('search.from')}
          </Text>
          <TextInput
            value={vm.from}
            onChangeText={vm.setFrom}
            placeholder={svc.searchHint}
            placeholderTextColor={t.fgFaint}
            style={{ fontSize: 15, fontFamily: t.font.bodyMedium, color: t.fg, marginTop: 4, paddingVertical: 2 }}
          />
        </View>
        {svc.id !== 'hotels' && (
          <Pressable
            onPress={vm.swap}
            accessibilityRole="button"
            accessibilityLabel={tr('a11y.swapOriginDestination')}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 }}
          >
            <ArrowUpDown size={16} color={t.fgMuted} />
          </Pressable>
        )}
      </View>
      {svc.id !== 'hotels' && (
        <View style={{ borderTopColor: t.border, borderTopWidth: 1, padding: 14 }}>
          <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tr('search.to')}</Text>
          <TextInput
            value={vm.to}
            onChangeText={vm.setTo}
            placeholder={tr('search.destination')}
            placeholderTextColor={t.fgFaint}
            style={{ fontSize: 15, fontFamily: t.font.bodyMedium, color: t.fg, marginTop: 4, paddingVertical: 2 }}
          />
        </View>
      )}
    </View>
  );

  // UX-1: the flights/hotels search isn't live yet and these dates have no picker.
  // Render them as plain read-only labels (no input card chrome / calendar icon)
  // so they don't masquerade as interactive fields.
  const datesRow = (
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 2 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {svc.id === 'hotels' ? tr('search.checkIn') : tr('search.depart')}
        </Text>
        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 15, color: t.fgMuted, marginTop: 4 }}>
          {vm.departDate}
        </Text>
      </View>
      {(svc.id !== 'flights' || vm.tripType === 'roundtrip') && (
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {svc.id === 'hotels' ? tr('search.checkOut') : tr('search.return')}
          </Text>
          <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 15, color: t.fgMuted, marginTop: 4 }}>
            {vm.returnDate}
          </Text>
        </View>
      )}
    </View>
  );

  const roomsStepper =
    svc.id === 'hotels' ? (
      <Stepper label={tr('search.rooms')} value={vm.rooms} unit={tr('search.roomUnit', { count: vm.rooms })} onDec={vm.decRooms} onInc={vm.incRooms} />
    ) : null;

  const guestsStepper = (
    <Stepper
      label={svc.id === 'hotels' ? tr('search.guests') : tr('search.travelers')}
      value={vm.travelers}
      unit={svc.id === 'hotels' ? tr('search.guestUnit', { count: vm.travelers }) : tr('search.adultUnit', { count: vm.travelers })}
      onDec={vm.decTravelers}
      onInc={vm.incTravelers}
    />
  );

  const searchButton = (
    <PrimaryButton label={tr('search.searchButton')} onPress={vm.onSearch} icon={<SearchIcon size={16} color="#fff" strokeWidth={2.2} />} style={{ marginTop: 6 }} />
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.back')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.bgSunken,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 22, fontWeight: '700', color: t.fg }}>
          {tr('search.title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: isWide ? 28 : 20,
          paddingBottom: 40,
          gap: 16,
          maxWidth: isWide ? 980 : 1100,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <MultiServiceTabs onSelect={vm.onSelectService} />

        {isWide ? (
          // Desktop web: two columns — From/To + dates on the left,
          // trip-type + steppers on the right.
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 16 }}>
              {fromToCard}
              {datesRow}
            </View>
            <View style={{ flex: 1, gap: 16 }}>
              {tripTypePills}
              {roomsStepper}
              {guestsStepper}
            </View>
          </View>
        ) : (
          // Mobile / native: single stacked column (unchanged).
          <>
            {tripTypePills}
            {fromToCard}
            {datesRow}
            {roomsStepper}
            {guestsStepper}
          </>
        )}

        {searchButton}
      </ScrollView>
    </SafeAreaView>
  );
}
