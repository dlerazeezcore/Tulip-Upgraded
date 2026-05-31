import React from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Archive } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { formatEsimDataLabel, useEsimStore } from '@/state/esimStore';
import { Flag } from '@/components/Flag';
import { StatusPill } from '@/components/StatusPill';
import { PressableScale } from '@/components/PressableScale';

/**
 * History view for terminal eSIM bundles (expired / cancelled / refunded /
 * revoked). The main /manage/esim list hides these by default — this screen
 * is the dedicated archive so the user can still find old bundles to
 * reference / dispute / re-buy.
 */
export default function EsimHistoryScreen() {
  const t = useTheme();
  const router = useRouter();
  const history = useEsimStore((s) => s.history);
  const loading = useEsimStore((s) => s.historyLoading);
  const refreshHistory = useEsimStore((s) => s.refreshHistory);

  React.useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/manage/esim'))}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Archive size={20} color={t.fgMuted} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            History
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
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={t.primary} />
          </View>
        ) : history.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 6 }}>
            <Archive size={32} color={t.fgFaint} strokeWidth={1.8} />
            <Text style={{ color: t.fgMuted }}>No past eSIMs yet.</Text>
            <Text style={{ color: t.fgFaint, fontSize: 12, textAlign: 'center' }}>
              Cancelled, refunded, and expired bundles will appear here for your records.
            </Text>
          </View>
        ) : (
          history.map((e) => (
            <PressableScale
              key={e.id}
              onPress={() => router.push(`/esim/${e.id}`)}
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
