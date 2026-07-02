// THIN UI — wiring lives in src/screens/results/useFlightResults.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plane } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useIsRTL } from '@/lib/rtl';
import { useFlightResults } from '@/screens/results/useFlightResults';

export default function FlightResults() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const isRTL = useIsRTL();
  const vm = useFlightResults();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.back')}
          hitSlop={4}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>
            {(vm.from || tr('results.flightsTitle')).split(' · ')[0]}{vm.to ? ` ${isRTL ? '←' : '→'} ${vm.to.split(' · ')[0]}` : ''}
          </Text>
          {vm.departDate ? (
            <Text style={{ fontSize: 11, color: t.fgMuted }}>
              {vm.departDate}{vm.tripType === 'roundtrip' && vm.returnDate ? ` – ${vm.returnDate}` : ''}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <Plane size={28} color={t.primary} strokeWidth={2} />
        </View>
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('results.flightsComingSoon')}</Text>
        <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center', maxWidth: 320 }}>
          {tr('results.flightsBody')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
