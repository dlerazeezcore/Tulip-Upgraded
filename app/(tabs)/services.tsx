// THIN UI — wiring lives in src/screens/services/useServices.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Plus, Star } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICES } from '@/data/services';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useServices } from '@/screens/services/useServices';

export default function Services() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useServices();
  const { isWide, colPct } = vm;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
      <ScrollView
        contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 40, gap: 20, maxWidth: 1200, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={tr('home.services')}
          subtitle={tr('servicesScreen.subtitle')}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -7 }}>
          {SERVICES.map((s) => {
            const Icon = s.Icon;
            return (
              <View key={s.id} style={{ width: colPct, padding: 7 }}>
                <Pressable
                  onPress={() => vm.openService(s.id)}
                  style={({ pressed }) => ({
                    padding: 22,
                    borderRadius: 18,
                    backgroundColor: t.bgElev,
                    borderColor: t.border,
                    borderWidth: 1,
                    overflow: 'hidden',
                    opacity: pressed ? 0.92 : 1,
                  })}
                >
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: -30,
                      right: -30,
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      backgroundColor: s.tint,
                      opacity: 0.6,
                    }}
                  />
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: s.tint,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={26} color={s.color} strokeWidth={2} />
                  </View>
                  <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg, marginTop: 14 }}>
                    {tr(`serviceNames.${s.id}`)}
                  </Text>
                  <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4, lineHeight: 18 }}>
                    {tr(`serviceVerbs.${s.id}`)}
                  </Text>
                  <View
                    style={{
                      marginTop: 16,
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      backgroundColor: s.color,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>
                      {tr('servicesScreen.open')}
                    </Text>
                    <ArrowRight size={12} color="#fff" strokeWidth={2.4} />
                  </View>
                </Pressable>
              </View>
            );
          })}

          {/* Extensible slot */}
          <View style={{ width: colPct, padding: 7 }}>
            <View
              style={{
                padding: 22,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: t.borderStrong,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 240,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
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
        <LinearGradient
          colors={[t.brand.blue50, t.brand.blue100]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            padding: 20,
            borderRadius: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: t.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={26} color="#fff" strokeWidth={2.2} fill="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.font.display, fontSize: 17, fontWeight: '800', color: t.brand.blue800 }}>
              {tr('servicesScreen.bundleTitle')}
            </Text>
            <Text style={{ fontSize: 12, color: t.brand.blue700, marginTop: 3 }}>
              {tr('servicesScreen.bundleSub')}
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
}
