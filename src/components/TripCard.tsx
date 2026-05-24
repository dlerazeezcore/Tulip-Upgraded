import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { ACTIVE_TRIP } from '@/data/trips';
import { SERVICES } from '@/data/services';
import { PressableScale } from './PressableScale';

export function TripCard({ compact = false }: { compact?: boolean }) {
  const t = useTheme();
  const router = useRouter();

  return (
    <PressableScale
      onPress={() => router.push(`/trip/${ACTIVE_TRIP.id}`)}
      scaleTo={0.98}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        ...t.shadow2,
      }}
    >
      <Image
        source={ACTIVE_TRIP.heroPhoto}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={[
          `${ACTIVE_TRIP.heroColor}E0`,
          'rgba(17, 24, 39, 0.55)',
          'rgba(17, 24, 39, 0.85)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={{ padding: compact ? 18 : 22 }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <View
            style={{
              paddingHorizontal: 9,
              paddingVertical: 4,
              backgroundColor: 'rgba(255,255,255,0.28)',
              borderRadius: 999,
            }}
          >
            <Text
              style={{ fontSize: 10, color: '#fff', fontWeight: '800', letterSpacing: 0.6 }}
            >
              UPCOMING TRIP
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: '#fff', opacity: 0.92 }}>
            {ACTIVE_TRIP.countdown}
          </Text>
        </View>
        <Text
          style={{
            fontSize: compact ? 24 : 30,
            color: '#fff',
            marginTop: 12,
            letterSpacing: -0.7,
            fontFamily: t.font.display,
            fontWeight: '700',
          }}
        >
          {ACTIVE_TRIP.name}
        </Text>
        <Text style={{ fontSize: 12, color: '#fff', opacity: 0.88, marginTop: 2 }}>
          {ACTIVE_TRIP.dates} · {ACTIVE_TRIP.bookings.length} bookings
        </Text>

        <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {ACTIVE_TRIP.bookings.map((b, i) => {
            const svc = SERVICES.find((s) => s.id === b.svc)!;
            const Icon = svc.Icon;
            return (
              <View
                key={i}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 11,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.18)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Icon size={11} color="#fff" strokeWidth={2} />
                <Text
                  style={{
                    fontSize: 11,
                    color: '#fff',
                    fontWeight: '600',
                    fontFamily: t.font.displayMedium,
                  }}
                >
                  {svc.label}
                </Text>
              </View>
            );
          })}
        </View>
      </LinearGradient>
    </PressableScale>
  );
}
