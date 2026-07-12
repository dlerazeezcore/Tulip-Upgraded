// THIN UI — wiring lives in src/screens/results/useHotelResults.ts.
import React from 'react';
import { View } from 'react-native';
import { BedDouble } from 'lucide-react-native';
import { StackHeader } from '@/components/StackHeader';
import { EmptyState } from '@/components/EmptyState';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useHotelResults } from '@/screens/results/useHotelResults';

export default function HotelResults() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useHotelResults();

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      <StackHeader title={tr('results.staysTitle')} onBack={vm.goBack} />

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon={BedDouble}
          title={tr('results.staysComingSoon')}
          subtitle={tr('results.staysBody')}
        />
      </View>
    </ScreenSafeArea>
  );
}
