import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { TRIPS } from '@/data/trips';
import { SERVICES } from '@/data/services';
import { useEsimStore } from '@/state/esimStore';
import { MY_STAYS, MY_FLIGHTS, MY_TRANSFERS, MY_CARS } from '@/data/myBookings';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PressableScale } from '@/components/PressableScale';
import { AnimatedScreen } from '@/components/AnimatedScreen';

type Tab = 'trips' | 'services';

function Segmented({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  const t = useTheme();
  const tabs: { id: Tab; label: string }[] = [
    { id: 'trips', label: 'Trips' },
    { id: 'services', label: 'Services' },
  ];
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.bgSunken, borderRadius: 12, padding: 4 }}>
      {tabs.map((tab) => {
        const on = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 9,
              alignItems: 'center',
              backgroundColor: on ? t.bgElev : 'transparent',
              ...(on ? t.shadow1 : {}),
            }}
          >
            <Text
              style={{
                fontFamily: t.font.displayMedium,
                fontWeight: '700',
                fontSize: 13,
                color: on ? t.fg : t.fgMuted,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TripsView() {
  const t = useTheme();
  const router = useRouter();
  return (
    <View style={{ gap: 14 }}>
      {TRIPS.map((trip) => (
        <PressableScale
          key={trip.id}
          onPress={() => router.push(`/trip/${trip.id}`)}
          scaleTo={0.98}
          style={{ borderRadius: 20, overflow: 'hidden', ...t.shadow2 }}
        >
          <Image
            source={trip.heroPhoto}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={[`${trip.heroColor}D8`, 'rgba(17, 24, 39, 0.55)', 'rgba(17, 24, 39, 0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={{ padding: 22 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 999 }}>
                <Text style={{ fontSize: 10, color: '#fff', fontWeight: '800', letterSpacing: 0.6 }}>
                  {trip.countdown.toUpperCase()}
                </Text>
              </View>
              <ChevronRight size={18} color="#fff" />
            </View>
            <Text style={{ fontSize: 24, color: '#fff', marginTop: 10, letterSpacing: -0.5, fontFamily: t.font.display, fontWeight: '700' }}>
              {trip.name}
            </Text>
            <Text style={{ fontSize: 12, color: '#fff', opacity: 0.88, marginTop: 2 }}>
              {trip.dates} · {trip.bookings.length} bookings
            </Text>
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {trip.bookings.map((b, i) => {
                const svc = SERVICES.find((s) => s.id === b.svc)!;
                const Icon = svc.Icon;
                return (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' }}>
                    <Icon size={11} color="#fff" strokeWidth={2} />
                    <Text style={{ fontSize: 10, color: '#fff', fontWeight: '600', fontFamily: t.font.displayMedium }}>
                      {svc.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </LinearGradient>
        </PressableScale>
      ))}
    </View>
  );
}

function ServicesView() {
  const t = useTheme();
  const router = useRouter();
  const esims = useEsimStore((s) => s.esims);

  const summary = useMemo(() => {
    const activeEsims = esims.filter((e) => e.status === 'active').length;
    return {
      esim: { count: esims.length, sub: activeEsims > 0 ? `${activeEsims} active` : 'None active' },
      hotels: { count: MY_STAYS.length, sub: `${MY_STAYS.filter((s) => s.status === 'upcoming').length} upcoming` },
      flights: { count: MY_FLIGHTS.length, sub: `${MY_FLIGHTS.filter((s) => s.status === 'upcoming').length} upcoming` },
      transfers: { count: MY_TRANSFERS.length, sub: `${MY_TRANSFERS.filter((s) => s.status === 'upcoming').length} upcoming` },
      cars: { count: MY_CARS.length, sub: `${MY_CARS.filter((s) => s.status === 'upcoming').length} upcoming` },
    } as Record<string, { count: number; sub: string }>;
  }, [esims]);

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 12, color: t.fgMuted, marginBottom: 2 }}>
        Manage each service on its own — even bookings that aren't part of a trip.
      </Text>
      {SERVICES.map((svc) => {
        const Icon = svc.Icon;
        const data = summary[svc.id] ?? { count: 0, sub: 'None yet' };
        return (
          <PressableScale
            key={svc.id}
            onPress={() => router.push(`/manage/${svc.id}`)}
            scaleTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              backgroundColor: t.bgElev,
              borderColor: t.border,
              borderWidth: 1,
              borderRadius: 16,
              padding: 16,
              ...t.shadow1,
            }}
          >
            <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: svc.tint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} color={svc.color} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                {svc.id === 'esim' ? 'My eSIMs' : svc.id === 'hotels' ? 'My Stays' : `My ${svc.label}`}
              </Text>
              <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>
                {data.count} {data.count === 1 ? 'item' : 'items'} · {data.sub}
              </Text>
            </View>
            <ChevronRight size={18} color={t.fgFaint} />
          </PressableScale>
        );
      })}
    </View>
  );
}

export default function Bookings() {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('trips');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Bookings" subtitle="Your trips and standalone services" />
        <Segmented value={tab} onChange={setTab} />
        {tab === 'trips' ? <TripsView /> : <ServicesView />}
      </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
}
