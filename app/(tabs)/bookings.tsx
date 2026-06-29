// THIN UI — wiring lives in src/screens/bookings/useBookings.ts.
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICES } from '@/data/services';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PressableScale } from '@/components/PressableScale';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useBookings } from '@/screens/bookings/useBookings';

export default function Bookings() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useBookings();
  const { isWide, esimSummary } = vm;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title={tr('bookings.title')} subtitle={tr('bookings.subtitle')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: isWide ? -5 : 0, gap: isWide ? 0 : 10 }}>
            {SERVICES.map((svc) => {
              const Icon = svc.Icon;
              const isEsim = svc.id === 'esim';
              const title = isEsim
                ? tr('bookings.myEsims')
                : svc.id === 'hotels'
                  ? tr('bookings.myStays')
                  : tr('bookings.myService', { label: tr(`serviceNames.${svc.id}`) });
              const sub = isEsim
                ? `${esimSummary.count} ${esimSummary.count === 1 ? tr('bookings.item') : tr('bookings.items')} · ${esimSummary.sub}`
                : tr('bookings.comingSoon');
              return (
                <View key={svc.id} style={{ width: isWide ? '50%' : '100%', padding: isWide ? 5 : 0 }}>
                  <PressableScale
                    onPress={() => vm.openManage(svc.id)}
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
                    <DirectionalChevron direction="forward" size={18} color={t.fgFaint} />
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
