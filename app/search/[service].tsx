// THIN UI — wiring lives in src/screens/search/useServiceSearch.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  Minus,
  Plus,
  Search as SearchIcon,
  User,
} from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { MultiServiceTabs } from '@/components/MultiServiceTabs';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useServiceSearch } from '@/screens/search/useServiceSearch';
import { useIsWideWeb } from '@/lib/responsive';

const TRIP_TYPES = [
  { id: 'roundtrip', label: 'Round trip' },
  { id: 'oneway',    label: 'One way' },
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
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <Minus size={14} color={t.fg} />
        </Pressable>
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, minWidth: 18, textAlign: 'center', color: t.fg }}>
          {value}
        </Text>
        <Pressable
          onPress={onInc}
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
              style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? t.primary : t.bgSunken }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: t.font.displayMedium, color: on ? '#fff' : t.fgMuted }}>
                {tt.label}
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
            {svc.id === 'hotels' ? 'Destination' : 'From'}
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
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 }}
          >
            <ArrowUpDown size={16} color={t.fgMuted} />
          </Pressable>
        )}
      </View>
      {svc.id !== 'hotels' && (
        <View style={{ borderTopColor: t.border, borderTopWidth: 1, padding: 14 }}>
          <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>To</Text>
          <TextInput
            value={vm.to}
            onChangeText={vm.setTo}
            placeholder="Destination"
            placeholderTextColor={t.fgFaint}
            style={{ fontSize: 15, fontFamily: t.font.bodyMedium, color: t.fg, marginTop: 4, paddingVertical: 2 }}
          />
        </View>
      )}
    </View>
  );

  const datesRow = (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1, padding: 14, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16 }}>
        <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {svc.id === 'hotels' ? 'Check-in' : 'Depart'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Calendar size={14} color={t.fgMuted} />
          <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 15, color: t.fg }}>{vm.departDate}</Text>
        </View>
      </View>
      {(svc.id !== 'flights' || vm.tripType === 'roundtrip') && (
        <View style={{ flex: 1, padding: 14, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16 }}>
          <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {svc.id === 'hotels' ? 'Check-out' : 'Return'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Calendar size={14} color={t.fgMuted} />
            <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 15, color: t.fg }}>{vm.returnDate}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const roomsStepper =
    svc.id === 'hotels' ? (
      <Stepper label="Rooms" value={vm.rooms} unit={vm.rooms === 1 ? 'room' : 'rooms'} onDec={vm.decRooms} onInc={vm.incRooms} />
    ) : null;

  const guestsStepper = (
    <Stepper
      label={svc.id === 'hotels' ? 'Guests' : 'Travelers'}
      value={vm.travelers}
      unit={svc.id === 'hotels' ? (vm.travelers === 1 ? 'guest' : 'guests') : vm.travelers === 1 ? 'adult' : 'adults'}
      onDec={vm.decTravelers}
      onInc={vm.incTravelers}
    />
  );

  const searchButton = (
    <PrimaryButton label="Search" onPress={vm.onSearch} icon={<SearchIcon size={16} color="#fff" strokeWidth={2.2} />} style={{ marginTop: 6 }} />
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
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 22, fontWeight: '700', color: t.fg }}>
          Search
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
