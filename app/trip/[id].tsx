import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { TRIPS } from '@/data/trips';
import { SERVICES } from '@/data/services';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const trip = TRIPS.find((tr) => tr.id === id) ?? TRIPS[0];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
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
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>
          Trip details
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20, maxWidth: 900, width: '100%', alignSelf: 'center' }}
      >
        <View style={{ borderRadius: 22, overflow: 'hidden', ...t.shadow3 }}>
          <Image
            source={trip.heroPhoto}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={[
              `${trip.heroColor}D0`,
              'rgba(17, 24, 39, 0.55)',
              'rgba(17, 24, 39, 0.85)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={{ padding: 24, minHeight: 200 }}
          >
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 9,
              paddingVertical: 4,
              backgroundColor: 'rgba(255,255,255,0.28)',
              borderRadius: 999,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>
              {trip.countdown.toUpperCase()}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 30,
              color: '#fff',
              marginTop: 12,
              letterSpacing: -0.6,
              fontFamily: t.font.display,
              fontWeight: '700',
            }}
          >
            {trip.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <MapPin size={12} color="#fff" />
            <Text style={{ color: '#fff', opacity: 0.85, fontSize: 12 }}>{trip.city}</Text>
          </View>
          <Text style={{ color: '#fff', opacity: 0.85, fontSize: 12, marginTop: 2 }}>
            {trip.dates}
          </Text>
          </LinearGradient>
        </View>

        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: t.fgMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginBottom: 10,
            }}
          >
            Bookings ({trip.bookings.length})
          </Text>

          <View style={{ gap: 10 }}>
            {trip.bookings.map((b, i) => {
              const svc = SERVICES.find((s) => s.id === b.svc)!;
              const Icon = svc.Icon;
              const statusColor =
                b.status === 'Confirmed' ? t.success : b.status === 'Ready' ? t.warning : t.fgMuted;
              return (
                <Pressable
                  key={i}
                  style={({ pressed }) => ({
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: t.bgElev,
                    borderColor: t.border,
                    borderWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: pressed ? 0.92 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: svc.tint,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={svc.color} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
                      {b.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{b.sub}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: statusColor }} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor, letterSpacing: 0.3 }}>
                        {b.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={t.fgFaint} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
