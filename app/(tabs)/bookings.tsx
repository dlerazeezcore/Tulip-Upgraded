// THIN UI — wiring lives in src/screens/bookings/useBookings.ts.
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PressableScale } from '@/components/PressableScale';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useBookings } from '@/screens/bookings/useBookings';

export default function Bookings() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useBookings();
  const { isWide, tiles } = vm;

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
        <ScrollView
          contentContainerStyle={{ padding: t.space.s5, paddingBottom: t.space.s8, gap: t.space.s4, maxWidth: 1200, width: '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title={tr('bookings.title')} subtitle={tr('bookings.subtitle')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: isWide ? -t.gridGutterHalf : 0, gap: isWide ? 0 : 10 }}>
            {tiles.map((tile) => (
              <View key={tile.id} style={{ width: isWide ? '50%' : '100%', padding: isWide ? t.gridGutterHalf : 0 }}>
                <PressableScale
                  onPress={() => vm.openManage(tile.id)}
                  scaleTo={0.98}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: t.bgElev,
                    borderColor: t.border,
                    borderWidth: 1,
                    borderRadius: t.radius.card,
                    padding: t.space.s4,
                    ...t.shadow1,
                  }}
                >
                  <View style={{ width: 46, height: 46, borderRadius: t.radius.badge, backgroundColor: tile.tint, alignItems: 'center', justifyContent: 'center' }}>
                    <tile.Icon size={22} color={tile.color} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>{tile.title}</Text>
                    <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{tile.sub}</Text>
                  </View>
                  <DirectionalChevron direction="forward" size={18} color={t.fgFaint} />
                </PressableScale>
              </View>
            ))}
          </View>
        </ScrollView>
      </AnimatedScreen>
    </ScreenSafeArea>
  );
}
