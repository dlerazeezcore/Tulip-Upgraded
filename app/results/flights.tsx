// THIN UI — wiring lives in src/screens/results/useFlightResults.ts.
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plane } from 'lucide-react-native';
import { StackHeader } from '@/components/StackHeader';
import { EmptyState } from '@/components/EmptyState';
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
      <StackHeader
        onBack={vm.goBack}
        title={`${(vm.from || tr('results.flightsTitle')).split(' · ')[0]}${vm.to ? ` ${isRTL ? '←' : '→'} ${vm.to.split(' · ')[0]}` : ''}`}
        subtitle={vm.departDate ? `${vm.departDate}${vm.tripType === 'roundtrip' && vm.returnDate ? ` – ${vm.returnDate}` : ''}` : null}
      />

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon={Plane}
          tone="primary"
          title={tr('results.flightsComingSoon')}
          subtitle={tr('results.flightsBody')}
        />
      </View>
    </SafeAreaView>
  );
}
