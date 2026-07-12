// THIN UI — wiring lives in src/screens/services/useServices.ts.
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, Star } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICES } from '@/data/services';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ServiceTile } from '@/components/ServiceTile';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useServices } from '@/screens/services/useServices';

export default function Services() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useServices();
  const { isWide, colPct } = vm;
  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
      <ScrollView
        contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 40, gap: 20, maxWidth: 1200, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={tr('home.services')}
          subtitle={tr('servicesScreen.subtitle')}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -t.gridGutterHalf }}>
          {SERVICES.map((s) => (
            <View key={s.id} style={{ width: colPct, padding: t.gridGutterHalf }}>
              <ServiceTile svc={s} size="lg" />
            </View>
          ))}

          {/* Extensible slot */}
          <View style={{ width: colPct, padding: t.gridGutterHalf }}>
            <View
              style={{
                flex: 1,
                padding: 22,
                borderRadius: t.radius.card,
                borderWidth: 2,
                borderColor: t.borderStrong,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: t.radius.md,
                  borderWidth: 2,
                  borderColor: t.borderStrong,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={24} color={t.fgFaint} strokeWidth={2} />
              </View>
              <Text style={{ fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fgMuted }}>
                {tr('servicesScreen.moreComing')}
              </Text>
              <Text style={{ fontSize: 12, color: t.fgMuted, textAlign: 'center' }}>
                {tr('servicesScreen.moreComingSub')}
              </Text>
            </View>
          </View>
        </View>

        {/* Bundle promo */}
        <View
          style={{
            padding: 20,
            borderRadius: t.radius.card,
            backgroundColor: t.infoBg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: t.radius.md,
              backgroundColor: t.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={26} color={t.onPrimary} strokeWidth={2.2} fill={t.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.font.display, fontSize: 17, fontWeight: '800', color: t.infoFg }}>
              {tr('servicesScreen.bundleTitle')}
            </Text>
            <Text style={{ fontSize: 12, color: t.infoFg, marginTop: 3 }}>
              {tr('servicesScreen.bundleSub')}
            </Text>
          </View>
        </View>
      </ScrollView>
      </AnimatedScreen>
    </ScreenSafeArea>
  );
}
