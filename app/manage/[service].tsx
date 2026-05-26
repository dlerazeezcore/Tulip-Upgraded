import React from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plane, Calendar, MapPin, Clock } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICES, serviceRoute } from '@/data/services';
import { useEsimStore } from '@/state/esimStore';
import { MY_STAYS, MY_FLIGHTS, MY_TRANSFERS, MY_CARS } from '@/data/myBookings';
import { Flag } from '@/components/Flag';
import { StatusPill } from '@/components/StatusPill';
import { PressableScale } from '@/components/PressableScale';

function Card({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const t = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      style={{
        backgroundColor: t.bgElev,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        ...t.shadow1,
      }}
    >
      {children}
    </PressableScale>
  );
}

function EsimList() {
  const t = useTheme();
  const router = useRouter();
  const esims = useEsimStore((s) => s.esims);
  const activate = useEsimStore((s) => s.activate);
  const refresh = useEsimStore((s) => s.refresh);
  const refreshing = useEsimStore((s) => s.refreshing);
  const loaded = useEsimStore((s) => s.loaded);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!loaded && refreshing) {
    return (
      <View style={{ paddingVertical: 30, alignItems: 'center' }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }

  if (loaded && esims.length === 0) {
    return (
      <View style={{ paddingVertical: 30, alignItems: 'center', gap: 6 }}>
        <Text style={{ color: t.fgMuted }}>No eSIMs yet.</Text>
        <Text style={{ color: t.fgFaint, fontSize: 12 }}>Buy one from the eSIM store to get started.</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {esims.map((e) => {
        const remaining = Math.max(0, e.planGb - e.usedGb);
        const frac = e.planGb > 0 ? remaining / e.planGb : 0;
        const barColor = e.status === 'active' ? t.success : e.status === 'expired' ? t.danger : t.warning;
        return (
          <Card key={e.id} onPress={() => router.push(`/esim/${e.id}`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Flag iso={e.iso} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                  {e.country}
                </Text>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                  {e.unlimited ? 'Unlimited data' : `${e.planGb} GB`} · {e.planDays} days
                </Text>
              </View>
              <StatusPill kind={e.status} />
            </View>

            {e.status === 'active' && (
              <View style={{ marginTop: 12 }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: t.bgSunken, overflow: 'hidden' }}>
                  <View style={{ width: e.unlimited ? '100%' : `${frac * 100}%`, height: 6, borderRadius: 3, backgroundColor: barColor }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: t.fg, fontWeight: '600' }}>
                    {e.unlimited ? 'Unlimited' : `${remaining.toFixed(1)} GB left`}
                  </Text>
                  <Text style={{ fontSize: 11, color: t.fgMuted }}>{e.daysLeft} days left</Text>
                </View>
              </View>
            )}

            {e.status === 'inactive' && (
              <Pressable
                onPress={() => activate(e.id)}
                style={{
                  marginTop: 12,
                  alignSelf: 'flex-start',
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  backgroundColor: t.primary,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>
                  Activate
                </Text>
              </Pressable>
            )}
          </Card>
        );
      })}
    </View>
  );
}

function StaysList() {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {MY_STAYS.map((s) => (
        <Card key={s.id}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Image source={s.photo} style={{ width: 64, height: 64, borderRadius: 12 }} contentFit="cover" transition={200} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg, flex: 1 }}>
                  {s.hotel}
                </Text>
                <StatusPill kind={s.status} />
              </View>
              <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{s.city}</Text>
              <Text style={{ fontSize: 12, color: t.fg, marginTop: 6 }}>
                {s.checkIn} – {s.checkOut} · {s.nights} nights · {s.guests} guests
              </Text>
              <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 2 }}>
                Confirmation {s.confirmation}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

function FlightsList() {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {MY_FLIGHTS.map((f) => (
        <Card key={f.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: f.color, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{f.airlineCode}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg }}>
                {f.from} → {f.to}
              </Text>
              <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                {f.number} · {f.date} · {f.depart}
              </Text>
              <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 2 }}>PNR {f.pnr}</Text>
            </View>
            <StatusPill kind={f.status} />
          </View>
        </Card>
      ))}
    </View>
  );
}

function TransfersList() {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {MY_TRANSFERS.map((tr) => (
        <Card key={tr.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg }}>
              {tr.vehicle}
            </Text>
            <StatusPill kind={tr.status} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <MapPin size={13} color={t.fgMuted} />
            <Text style={{ fontSize: 13, color: t.fg }}>{tr.from} → {tr.to}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Clock size={13} color={t.fgMuted} />
            <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr.date} · {tr.time}</Text>
          </View>
          <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 6 }}>Confirmation {tr.confirmation}</Text>
        </Card>
      ))}
    </View>
  );
}

function CarsList() {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {MY_CARS.map((c) => (
        <Card key={c.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg }}>
              {c.model}
            </Text>
            <StatusPill kind={c.status} />
          </View>
          <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 4 }}>{c.supplier} · {c.location}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Calendar size={13} color={t.fgMuted} />
            <Text style={{ fontSize: 12, color: t.fg }}>{c.pickUp} → {c.dropOff}</Text>
          </View>
          <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 6 }}>Confirmation {c.confirmation}</Text>
        </Card>
      ))}
    </View>
  );
}

export default function ManageService() {
  const { service } = useLocalSearchParams<{ service: string }>();
  const t = useTheme();
  const router = useRouter();
  const svc = SERVICES.find((s) => s.id === service);

  const title =
    service === 'esim' ? 'My eSIMs'
    : service === 'hotels' ? 'My Stays'
    : service === 'flights' ? 'My Flights'
    : service === 'transfers' ? 'My Transfers'
    : service === 'cars' ? 'My Cars'
    : 'My Bookings';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {svc && <svc.Icon size={20} color={svc.color} strokeWidth={2} />}
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            {title}
          </Text>
        </View>
        {svc && (
          <Pressable
            onPress={() => router.push(serviceRoute(svc.id) as any)}
            style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: svc.color }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>
              Book new
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10, maxWidth: 900, width: '100%', alignSelf: 'center' }}>
        {service === 'esim' && <EsimList />}
        {service === 'hotels' && <StaysList />}
        {service === 'flights' && <FlightsList />}
        {service === 'transfers' && <TransfersList />}
        {service === 'cars' && <CarsList />}
      </ScrollView>
    </SafeAreaView>
  );
}
