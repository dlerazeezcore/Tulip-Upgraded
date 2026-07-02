// THIN UI — wiring lives in src/screens/results/useHotelResults.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BedDouble } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
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
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>{tr('results.staysTitle')}</Text>
      </View>

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
