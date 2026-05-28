import React, { useMemo } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICES } from '@/data/services';
import { useEsimStore } from '@/state/esimStore';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PressableScale } from '@/components/PressableScale';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useIsWideWeb } from '@/lib/responsive';

export default function Bookings() {
  const t = useTheme();
  const router = useRouter();
  const isWide = useIsWideWeb();
  const esims = useEsimStore((s) => s.esims);

  // eSIM is the only live service today; its counts are real (from the store).
  const esimSummary = useMemo(() => {
    const active = esims.filter((e) => e.status === 'active').length;
    return {
      count: esims.length,
      sub: active > 0 ? `${active} active` : esims.length ? 'None active' : 'None yet',
    };
  }, [esims]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Bookings" subtitle="Manage your services" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: isWide ? -5 : 0, gap: isWide ? 0 : 10 }}>
            {SERVICES.map((svc) => {
              const Icon = svc.Icon;
              const isEsim = svc.id === 'esim';
              const title = isEsim ? 'My eSIMs' : svc.id === 'hotels' ? 'My Stays' : `My ${svc.label}`;
              const sub = isEsim
                ? `${esimSummary.count} ${esimSummary.count === 1 ? 'item' : 'items'} · ${esimSummary.sub}`
                : 'Coming soon';
              return (
                <View key={svc.id} style={{ width: isWide ? '50%' : '100%', padding: isWide ? 5 : 0 }}>
                  <PressableScale
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
                      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>{title}</Text>
                      <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{sub}</Text>
                    </View>
                    <ChevronRight size={18} color={t.fgFaint} />
                  </PressableScale>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
}
