import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Search, ArrowRight, MapPin, Bell } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ServiceTile } from '@/components/ServiceTile';
import { MultiServiceTabs } from '@/components/MultiServiceTabs';
import { TripCard } from '@/components/TripCard';
import { ActiveEsimCard } from '@/components/ActiveEsimCard';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { PressableScale } from '@/components/PressableScale';
import { SERVICES, SERVICE_SLOT } from '@/data/services';
import { USER } from '@/data/user';
import { POPULAR_COUNTRIES } from '@/data/esim';
import { useSearchStore } from '@/state/searchStore';
import { useMoney } from '@/lib/money';

const blurhash = 'L9Gugw00of%MM_RP4nbHIVRPRPxu';

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const money = useMoney();
  const activeService = useSearchStore((s) => s.activeService);
  const svc = SERVICES.find((s) => s.id === activeService)!;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          gap: 22,
          maxWidth: 1200,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 13, color: t.fgMuted, fontFamily: t.font.bodyMedium, fontWeight: '500' }}>
              Good morning, {USER.firstName}
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
              Where to next?
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CurrencyPicker />
            <PressableScale
              scaleTo={0.92}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: t.bgElev,
                borderWidth: 1,
                borderColor: t.border,
                alignItems: 'center',
                justifyContent: 'center',
                ...t.shadow1,
              }}
            >
              <Bell size={18} color={t.fg} strokeWidth={2} />
            </PressableScale>
          </View>
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
              onPress={() => router.push(`/search/${svc.id}`)}
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
              <Text style={{ flex: 1, fontSize: 14, color: t.fgFaint }}>{svc.searchHint}</Text>
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
                  Search
                </Text>
                <ArrowRight size={12} color="#fff" strokeWidth={2.4} />
              </View>
            </PressableScale>
          </BlurView>
        </View>

        {/* Trip card */}
        <TripCard />

        {/* Active eSIM lifecycle — shows even for eSIM-only customers */}
        <ActiveEsimCard />

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
              Services
            </Text>
            <Pressable onPress={() => router.push('/services')}>
              <Text style={{ fontSize: 12, color: t.primary, fontWeight: '600' }}>See all</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
            {[...SERVICES, SERVICE_SLOT].map((s) => (
              <View key={s.id} style={{ width: '33.33%', padding: 5 }}>
                <ServiceTile svc={s as any} />
              </View>
            ))}
          </View>
        </View>

        {/* Popular destinations — photo cards */}
        <View>
          <Text
            style={{
              fontFamily: t.font.display,
              fontSize: 18,
              fontWeight: '700',
              color: t.fg,
              letterSpacing: -0.3,
              marginBottom: 12,
            }}
          >
            Popular destinations
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 10 }}
          >
            {POPULAR_COUNTRIES.map((c) => (
              <PressableScale
                key={c.iso}
                scaleTo={0.96}
                style={{
                  width: 150,
                  height: 200,
                  borderRadius: 18,
                  overflow: 'hidden',
                  ...t.shadow2,
                }}
              >
                <Image
                  source={c.photo}
                  placeholder={{ blurhash }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']}
                  start={{ x: 0, y: 0.3 }}
                  end={{ x: 0, y: 1 }}
                  style={{ flex: 1, padding: 14, justifyContent: 'flex-end' }}
                >
                  <Text
                    style={{
                      fontFamily: t.font.display,
                      fontSize: 17,
                      fontWeight: '700',
                      color: '#fff',
                      letterSpacing: -0.3,
                    }}
                  >
                    {c.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#fff', opacity: 0.9, marginTop: 2 }}>
                    eSIM from {money(c.from)}
                  </Text>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}
                  >
                    <MapPin size={11} color="#fff" />
                    <Text style={{ fontSize: 10, color: '#fff', opacity: 0.85 }}>
                      Top destination
                    </Text>
                  </View>
                </LinearGradient>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
}
