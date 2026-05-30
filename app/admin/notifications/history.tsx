// THIN UI — wiring lives in src/screens/admin/notifications/useNotificationHistory.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { ChevronLeft, History } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useNotificationHistory } from '@/screens/admin/notifications/useNotificationHistory';

function statusColor(t: any, status: string): string {
  const s = status.toLowerCase();
  if (s === 'sent') return t.success;
  if (s === 'partial') return t.warning ?? '#F59E0B';
  if (s === 'failed') return t.danger;
  if (s === 'dry_run') return t.fgMuted;
  return t.fgMuted;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminNotificationHistory() {
  const t = useTheme();
  const vm = useNotificationHistory();

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={vm.goBack} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <History size={20} color={t.primary} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            Notification history
          </Text>
        </View>
      </View>

      {vm.loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10, maxWidth: 720, width: '100%', alignSelf: 'center' }}
          refreshControl={<RefreshControl refreshing={vm.refreshing} onRefresh={vm.refresh} tintColor={t.primary} />}
        >
          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}

          {vm.rows.length === 0 ? (
            <Text style={{ fontSize: 13, color: t.fgMuted, padding: 24, textAlign: 'center' }}>
              No notifications sent yet.
            </Text>
          ) : (
            vm.rows.map((row) => {
              const sc = statusColor(t, row.status);
              return (
                <View
                  key={row.id}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: t.bgElev,
                    borderColor: t.border,
                    borderWidth: 1,
                    gap: 6,
                    ...t.shadow1,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <Text
                      style={{ flex: 1, fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg }}
                      numberOfLines={1}
                    >
                      {row.title}
                    </Text>
                    <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, backgroundColor: `${sc}20` }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: sc, textTransform: 'uppercase' }}>
                        {row.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: t.fgMuted }} numberOfLines={2}>{row.body}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: t.success, fontWeight: '600' }}>
                      ✓ {row.successCount}
                    </Text>
                    {row.failureCount > 0 && (
                      <Text style={{ fontSize: 11, color: t.danger, fontWeight: '600' }}>
                        ✗ {row.failureCount}
                      </Text>
                    )}
                    {row.invalidTokenCount > 0 && (
                      <Text style={{ fontSize: 11, color: t.fgMuted }}>
                        invalid {row.invalidTokenCount}
                      </Text>
                    )}
                    <Text style={{ flex: 1, textAlign: 'right', fontSize: 11, color: t.fgFaint }}>
                      {row.recipientScope}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: t.fgFaint }}>
                    {formatDate(row.sentAt || row.createdAt)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
