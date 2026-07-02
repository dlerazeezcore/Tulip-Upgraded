// THIN UI — wiring lives in src/screens/manage/useEsimHistory.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Archive } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { formatEsimDataLabel } from '@/state/esimStore';
import { Flag } from '@/components/Flag';
import { StatusPill } from '@/components/StatusPill';
import { PressableScale } from '@/components/PressableScale';
import { EsimListSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useEsimHistory } from '@/screens/manage/useEsimHistory';

/**
 * History view for terminal eSIM bundles (expired / cancelled / refunded /
 * revoked). The main /manage/esim list hides these by default — this screen
 * is the dedicated archive so the user can still find old bundles to
 * reference / dispute / re-buy.
 */
export default function EsimHistoryScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useEsimHistory();
  const { history, loading, refreshHistory } = vm;

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
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Archive size={20} color={t.fgMuted} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            {tr('manage.history')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10, maxWidth: 900, width: '100%', alignSelf: 'center' }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshHistory} tintColor={t.primary} colors={[t.primary]} />
        }
      >
        {loading && history.length === 0 ? (
          <EsimListSkeleton count={2} />
        ) : history.length === 0 ? (
          <EmptyState
            icon={Archive}
            title={tr('manage.historyEmptyTitle')}
            subtitle={tr('manage.historyEmptySub')}
          />
        ) : (
          history.map((e) => (
            <PressableScale
              key={e.id}
              onPress={() => vm.goEsim(e.id)}
              scaleTo={0.98}
              style={{
                backgroundColor: t.bgElev,
                borderColor: t.border,
                borderWidth: 1,
                borderRadius: 16,
                padding: 14,
                opacity: 0.85,
                ...t.shadow1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Flag iso={e.iso} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                    {e.country}
                  </Text>
                  <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                    {formatEsimDataLabel(e.dataLabel)}{e.planDays > 0 ? ` · ${e.planDays} days` : ''}
                  </Text>
                  {e.iccid ? (
                    <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 2 }} numberOfLines={1}>
                      ICCID …{e.iccid.slice(-4)}
                    </Text>
                  ) : null}
                </View>
                <StatusPill kind="expired" />
              </View>
            </PressableScale>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
