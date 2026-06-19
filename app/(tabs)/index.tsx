import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ServiceTile } from '@/components/ServiceTile';
import { MultiServiceTabs } from '@/components/MultiServiceTabs';
import { ActiveEsimCard } from '@/components/ActiveEsimCard';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { PressableScale } from '@/components/PressableScale';
import { SERVICES, serviceRoute } from '@/data/services';
import { EsimSupportBanner } from '@/components/EsimSupportBanner';
import { useSearchStore } from '@/state/searchStore';
import { useAuthStore } from '@/state/authStore';
import { useIsWideWeb } from '@/lib/responsive';

function greetingKeyForHour(h: number): string {
  if (h < 12) return 'home.goodMorning';
  if (h < 18) return 'home.goodAfternoon';
  return 'home.goodEvening';
}

const blurhash = 'L9Gugw00of%MM_RP4nbHIVRPRPxu';

export default function Home() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const activeService = useSearchStore((s) => s.activeService);
  const svc = SERVICES.find((s) => s.id === activeService)!;
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const greeting = tr(greetingKeyForHour(new Date().getHours()));
  const isWide = useIsWideWeb();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
      <ScrollView
        contentContainerStyle={{
          padding: isWide ? 28 : 20,
          paddingBottom: 40,
          gap: 22,
          maxWidth: 1200,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: t.fgMuted, fontFamily: t.font.bodyMedium, fontWeight: '500' }}>
              {greeting}{firstName ? `, ${firstName}` : ''}
            </Text>
            <Text
              style={{
                fontFamily: t.font.display,
                fontSize: 32,
                fontWeight: '700',
                letterSpacing: -0.8,
                color: t.fg,
                marginTop: 4,
              }}
            >
              {tr('home.whereToNext')}
            </Text>
          </View>
          <CurrencyPicker />
        </View>

        {/* Hero search — frosted glass over a photo backdrop */}
        <View
          style={{
            borderRadius: t.radius.lg,
            overflow: 'hidden',
            ...t.shadow2,
          }}
        >
          <Image
            source="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85"
            placeholder={{ blurhash }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={['rgba(15,23,42,0.30)', 'rgba(15,23,42,0.55)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            pointerEvents="none"
          />
          <BlurView
            intensity={28}
            tint="dark"
            style={{ padding: 16, gap: 14 }}
          >
            <MultiServiceTabs onDark />

            <PressableScale
              onPress={() => router.push(serviceRoute(svc.id) as any)}
              scaleTo={0.985}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 14,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.92)',
              }}
            >
              <Search size={18} color={t.fgMuted} />
              <Text style={{ flex: 1, fontSize: 14, color: t.fgFaint }}>{tr(`serviceVerbs.${svc.id}`)}</Text>
              <View
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  backgroundColor: svc.color,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: '700',
                    fontFamily: t.font.displayMedium,
                  }}
                >
                  {tr('common.search')}
                </Text>
                <ArrowRight size={12} color="#fff" strokeWidth={2.4} />
              </View>
            </PressableScale>
          </BlurView>
        </View>

        {/* Active eSIM (real data from the user's profiles) */}
        <ActiveEsimCard />

        {/* eSIM hardware advisory — only shown when the OS definitively says no. */}
        <EsimSupportBanner />

        {/* Services grid */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: t.font.display,
                fontSize: 18,
                fontWeight: '700',
                color: t.fg,
                letterSpacing: -0.3,
              }}
            >
              {tr('home.services')}
            </Text>
            <Pressable onPress={() => router.push('/services')}>
              <Text style={{ fontSize: 12, color: t.primary, fontWeight: '600' }}>{tr('home.seeAll')}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
            {SERVICES.map((s) => (
              // 4 columns on desktop web (≥1024), 3 on mobile/native — unchanged off-web.
              <View key={s.id} style={{ width: isWide ? '25%' : '33.33%', padding: 5 }}>
                <ServiceTile svc={s as any} />
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
}
