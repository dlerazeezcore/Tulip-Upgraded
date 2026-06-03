import React, { useEffect } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { SERVICES, Service } from '@/data/services';
import { useSearchStore } from '@/state/searchStore';
import { PrimaryButton } from '@/components/PrimaryButton';

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
  const { service } = useLocalSearchParams<{ service: string }>();
  const t = useTheme();
  const router = useRouter();
  const {
    activeService,
    setActive,
    from,
    to,
    setFrom,
    setTo,
    swap,
    departDate,
    returnDate,
    travelers,
    setTravelers,
    rooms,
    setRooms,
    tripType,
    setTripType,
  } = useSearchStore();

  // The ROUTE PARAM is the source of truth for which service this screen
  // shows. Previously we rendered from the global store, which could be stale
  // when Expo Router reused this dynamic [service] screen — so opening Hotels
  // (or any service) from the Services tab showed the Flights form. Deriving
  // `svc` from the param fixes that regardless of store/effect timing.
  const routeServiceId = SERVICES.some((s) => s.id === service)
    ? (service as Service['id'])
    : null;
  const svc = SERVICES.find((s) => s.id === (routeServiceId ?? activeService)) ?? SERVICES[0];

  // Keep the store in sync so MultiServiceTabs highlights the right tab.
  useEffect(() => {
    if (routeServiceId && routeServiceId !== activeService) {
      setActive(routeServiceId);
    }
  }, [routeServiceId, activeService, setActive]);

  // Switching tabs updates the URL param so the screen re-derives `svc`
  // reliably (esim jumps to its dedicated store).
  const onSelectService = (id: Service['id']) => {
    setActive(id);
    if (id === 'esim') {
      router.replace('/esim-store');
      return;
    }
    router.setParams({ service: id });
  };

  const onSearch = () => {
    if (svc.id === 'esim') router.replace('/esim-store');
    else if (svc.id === 'hotels') router.push('/results/hotels');
    else if (svc.id === 'flights') router.push('/results/flights');
    else router.push('/results/flights'); // transfers/cars demo → flights
  };

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
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 22, fontWeight: '700', color: t.fg }}>
          Search
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          gap: 16,
          maxWidth: 1100,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <MultiServiceTabs onSelect={onSelectService} />

        {svc.id === 'flights' && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {TRIP_TYPES.map((tt) => {
              const on = tt.id === tripType;
              return (
                <Pressable
                  key={tt.id}
                  onPress={() => setTripType(tt.id)}
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
                    {tt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* From / To */}
        <View
          style={{
            backgroundColor: t.bgElev,
            borderColor: t.border,
            borderWidth: 1,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, padding: 14 }}>
              <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {svc.id === 'hotels' ? 'Destination' : 'From'}
              </Text>
              <TextInput
                value={from}
                onChangeText={setFrom}
                placeholder={svc.searchHint}
                placeholderTextColor={t.fgFaint}
                style={{ fontSize: 15, fontFamily: t.font.bodyMedium, color: t.fg, marginTop: 4, paddingVertical: 2 }}
              />
            </View>
            {svc.id !== 'hotels' && (
              <Pressable
                onPress={swap}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: t.bgSunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: 8,
                }}
              >
                <ArrowUpDown size={16} color={t.fgMuted} />
              </Pressable>
            )}
          </View>
          {svc.id !== 'hotels' && (
            <View style={{ borderTopColor: t.border, borderTopWidth: 1, padding: 14 }}>
              <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                To
              </Text>
              <TextInput
                value={to}
                onChangeText={setTo}
                placeholder="Destination"
                placeholderTextColor={t.fgFaint}
                style={{ fontSize: 15, fontFamily: t.font.bodyMedium, color: t.fg, marginTop: 4, paddingVertical: 2 }}
              />
            </View>
          )}
        </View>

        {/* Dates */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              padding: 14,
              backgroundColor: t.bgElev,
              borderColor: t.border,
              borderWidth: 1,
              borderRadius: 16,
            }}
          >
            <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {svc.id === 'hotels' ? 'Check-in' : 'Depart'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Calendar size={14} color={t.fgMuted} />
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 15, color: t.fg }}>
                {departDate}
              </Text>
            </View>
          </View>
          {(svc.id !== 'flights' || tripType === 'roundtrip') && (
            <View
              style={{
                flex: 1,
                padding: 14,
                backgroundColor: t.bgElev,
                borderColor: t.border,
                borderWidth: 1,
                borderRadius: 16,
              }}
            >
              <Text style={{ fontSize: 10, color: t.fgFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {svc.id === 'hotels' ? 'Check-out' : 'Return'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Calendar size={14} color={t.fgMuted} />
                <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 15, color: t.fg }}>
                  {returnDate}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Rooms (hotels only) */}
        {svc.id === 'hotels' && (
          <Stepper
            label="Rooms"
            value={rooms}
            unit={rooms === 1 ? 'room' : 'rooms'}
            onDec={() => setRooms(rooms - 1)}
            onInc={() => setRooms(rooms + 1)}
          />
        )}

        {/* Guests / Travelers */}
        <Stepper
          label={svc.id === 'hotels' ? 'Guests' : 'Travelers'}
          value={travelers}
          unit={
            svc.id === 'hotels'
              ? travelers === 1 ? 'guest' : 'guests'
              : travelers === 1 ? 'adult' : 'adults'
          }
          onDec={() => setTravelers(travelers - 1)}
          onInc={() => setTravelers(travelers + 1)}
        />

        <PrimaryButton
          label="Search"
          onPress={onSearch}
          icon={<SearchIcon size={16} color="#fff" strokeWidth={2.2} />}
          style={{ marginTop: 6 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
