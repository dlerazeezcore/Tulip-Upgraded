import React from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICES, serviceRoute } from '@/data/services';
import { formatEsimDataLabel, useEsimStore } from '@/state/esimStore';
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
  // Show all profiles — user policy: "the plan stays there if used or not".
  // Cancelled / expired profiles get the EXPIRED pill and the detail screen
  // hides the install card for them.
  const esims = useEsimStore((s) => s.esims);
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
                  {formatEsimDataLabel(e.dataLabel)}{e.planDays > 0 ? ` · ${e.planDays} days` : ''}
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
              // Don't render a separate Activate button here — tapping the
              // whole card takes the user to the detail page, where the full
              // install flow lives (Activate + QR + Share). A duplicate
              // button on the list calls the wrong backend action and
              // confuses users about "did I install or not?".
              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 11, color: t.fgMuted }}>
                  Tap to install →
                </Text>
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

function ComingSoon({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center', gap: 8 }}>
      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>Coming soon</Text>
      <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center', maxWidth: 320 }}>
        {label} booking isn't available yet. eSIMs are live today — check the eSIM store.
      </Text>
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
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
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
        {svc && service === 'esim' && (
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
        {service === 'esim' ? <EsimList /> : <ComingSoon label={svc?.label ?? 'This'} />}
      </ScrollView>
    </SafeAreaView>
  );
}
