// THIN UI — wiring lives in src/screens/results/useFlightResults.ts.
import React from 'react';
import { View } from 'react-native';
import { Plane } from 'lucide-react-native';
import { StackHeader } from '@/components/StackHeader';
import { EmptyState } from '@/components/EmptyState';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useFlightResults } from '@/screens/results/useFlightResults';

export default function FlightResults() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useFlightResults();

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      <StackHeader onBack={vm.goBack} title={vm.title} subtitle={vm.subtitle} />

      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Muted tone: a passive "coming soon" with no CTA shouldn't use the
            attention-drawing primary empty state (audit #22). */}
        <EmptyState
          icon={Plane}
          title={tr('results.flightsComingSoon')}
          subtitle={tr('results.flightsBody')}
        />
      </View>
    </ScreenSafeArea>
  );
}
