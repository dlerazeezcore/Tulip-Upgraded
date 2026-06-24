// THIN UI — wiring lives in src/screens/results/useHotelResults.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, BedDouble } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useHotelResults } from '@/screens/results/useHotelResults';

export default function HotelResults() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useHotelResults();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.back')}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>{tr('results.staysTitle')}</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <BedDouble size={28} color={t.primary} strokeWidth={2} />
        </View>
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('results.staysComingSoon')}</Text>
        <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center', maxWidth: 320 }}>
          {tr('results.staysBody')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
