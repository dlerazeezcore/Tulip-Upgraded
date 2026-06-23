// THIN UI — wiring lives in src/screens/results/useFlightResults.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plane } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useFlightResults } from '@/screens/results/useFlightResults';

export default function FlightResults() {
  const t = useTheme();
  const vm = useFlightResults();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>
            {(vm.from || 'Flights').split(' · ')[0]}{vm.to ? ` → ${vm.to.split(' · ')[0]}` : ''}
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
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>Flights coming soon</Text>
        <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center', maxWidth: 320 }}>
          Flight booking isn't live yet. eSIMs are available today from the eSIM store.
        </Text>
      </View>
    </SafeAreaView>
  );
}
