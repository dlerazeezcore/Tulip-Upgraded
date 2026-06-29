import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { Hotel } from '@/data/hotels';
import { PressableScale } from './PressableScale';
import { useMoney } from '@/lib/money';

const blurhash = 'L9Gugw00of%MM_RP4nbHIVRPRPxu';

export function HotelCard({ hotel, onPress }: { hotel: Hotel; onPress?: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const money = useMoney();
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
        flexDirection: 'row',
        gap: 14,
        ...t.shadow1,
      }}
    >
      {/* Badges below sit on the photo, so they stay light-on-dark regardless
          of app theme — these whites/darks are intentional overlay colors, not
          token bypasses (same rationale as the eSIM QR badge). */}
      <View style={{ width: 160, height: 120, borderRadius: 12, overflow: 'hidden' }}>
        <Image
          source={hotel.photo}
          placeholder={{ blurhash }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.45)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', inset: 0 } as any}
          pointerEvents="none"
        />
        <View
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(255,255,255,0.92)',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: '#0F172A', fontSize: 10, fontWeight: '800' }}>
            {hotel.stars}★
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.saveToFavorites')}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255,255,255,0.92)',
            padding: 6,
            borderRadius: 999,
          }}
        >
          <Heart size={14} color="#1F2937" strokeWidth={2} />
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text
            style={{
              fontFamily: t.font.display,
              fontWeight: '700',
              fontSize: 16,
              color: t.fg,
              letterSpacing: -0.3,
            }}
          >
            {hotel.name}
          </Text>
          <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{hotel.area}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
            <Star size={12} color={t.accent.amber} fill={t.accent.amber} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.fg }}>{hotel.rating}</Text>
            <Text style={{ fontSize: 11, color: t.fgMuted }}>({hotel.reviews} reviews)</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, color: t.fgMuted }}>{tr('hotel.from')}</Text>
          <Text
            style={{
              fontFamily: t.font.display,
              fontWeight: '700',
              fontSize: 20,
              color: t.fg,
              letterSpacing: -0.4,
            }}
          >
            {money(hotel.price)}
          </Text>
          <Text style={{ fontSize: 10, color: t.fgMuted }}>per night</Text>
        </View>
      </View>
    </PressableScale>
  );
}
