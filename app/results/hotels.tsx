// THIN UI — wiring lives in src/screens/results/useHotelResults.ts.
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BedDouble } from 'lucide-react-native';
import { StackHeader } from '@/components/StackHeader';
import { EmptyState } from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useHotelResults } from '@/screens/results/useHotelResults';

export default function HotelResults() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useHotelResults();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <StackHeader title={tr('results.staysTitle')} onBack={vm.goBack} />

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon={BedDouble}
          tone="primary"
          title={tr('results.staysComingSoon')}
          subtitle={tr('results.staysBody')}
        />
      </View>
    </SafeAreaView>
  );
}
