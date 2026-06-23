// THIN UI — wiring lives in src/screens/admin/useAdminOrders.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { ChevronLeft, Globe, ChevronDown, RefreshCw, Check, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import type { AdminOrder } from '@/services/types';
import { formatIqd } from '@/lib/pricing';
import { useAdminOrders } from '@/screens/admin/useAdminOrders';

const YEARS = [2026, 2027, 2028, 2029, 2030];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ESIM_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'installed', label: 'Installed' },
  { id: 'not_installed', label: 'Not installed' },
  { id: 'expired', label: 'Expired' },
  { id: 'used', label: 'Data used' },
];

const ESIM_LABEL: Record<string, string> = {
  installed: 'Installed',
  not_installed: 'Not installed',
  expired: 'Expired',
  used: 'Data used',
  pending: 'Pending',
};

function orderDate(o: AdminOrder): string {
  return o.bookedAt || o.createdAt || '';
}

export default function AdminOrders() {
  const t = useTheme();
  const vm = useAdminOrders();
  const {
    year, month, esim, setYear, setMonth, setEsim,
    orders, filtered, loading, error,
    expanded, toggle,
    refreshing, refreshSummary, onRefreshFromProvider,
  } = vm;

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const labelStyle = { fontSize: 11, fontWeight: '700' as const, color: t.fgMuted, textTransform: 'uppercase' as const, letterSpacing: 0.4 };
  const Chip = ({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? t.primary : t.bgSunken }}>
      <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 12, color: on ? '#fff' : t.fgMuted }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          Order history{month !== null && !loading ? ` · ${orders.length}` : ''}
        </Text>
        <Pressable
          onPress={onRefreshFromProvider}
          disabled={refreshing}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: t.primary,
            backgroundColor: refreshing ? t.bgSunken : 'transparent',
            opacity: pressed || refreshing ? 0.7 : 1,
          })}
        >
          <RefreshCw size={14} color={t.primary} strokeWidth={2.2} />
          <Text style={{ color: t.primary, fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>
            {refreshing ? 'Refreshing…' : 'Refresh from provider'}
          </Text>
        </Pressable>
      </View>

      {refreshSummary && (
        <View style={{ marginHorizontal: 20, marginTop: 4, padding: 10, borderRadius: 12, backgroundColor: refreshSummary.errorCount > 0 ? 'rgba(245,158,11,0.10)' : 'rgba(22,163,74,0.10)', borderWidth: 1, borderColor: refreshSummary.errorCount > 0 ? 'rgba(245,158,11,0.35)' : 'rgba(22,163,74,0.35)', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {refreshSummary.errorCount > 0 ? (
            <AlertCircle size={14} color={t.warning} />
          ) : (
            <Check size={14} color={t.success} strokeWidth={2.5} />
          )}
          <Text style={{ flex: 1, fontSize: 11, color: t.fg }}>
            Synced {refreshSummary.attempted} profile{refreshSummary.attempted === 1 ? '' : 's'} from provider · {refreshSummary.activeRefreshed} updated · {refreshSummary.placeholdersRecovered} recovered{refreshSummary.errorCount > 0 ? ` · ${refreshSummary.errorCount} error${refreshSummary.errorCount === 1 ? '' : 's'}` : ''}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14, maxWidth: 820, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: 8 }}>
          <Text style={labelStyle}>Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {YEARS.map((y) => <Chip key={y} on={year === y} label={String(y)} onPress={() => setYear(y)} />)}
          </ScrollView>
          <Text style={[labelStyle, { marginTop: 4 }]}>Month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {MONTHS.map((m, i) => <Chip key={m} on={month === i + 1} label={m} onPress={() => setMonth(i + 1)} />)}
          </ScrollView>
          {month !== null && (
            <>
              <Text style={[labelStyle, { marginTop: 4 }]}>eSIM status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {ESIM_FILTERS.map((f) => <Chip key={f.id} on={esim === f.id} label={f.label} onPress={() => setEsim(f.id)} />)}
              </ScrollView>
            </>
          )}
        </View>

        {month === null ? (
          <Text style={{ color: t.fgMuted, textAlign: 'center', paddingVertical: 40 }}>Select a year and month to view orders.</Text>
        ) : loading ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
        ) : error ? (
          <Text style={{ color: t.danger, textAlign: 'center', paddingVertical: 20 }}>{error}</Text>
        ) : filtered.length === 0 ? (
          <Text style={{ color: t.fgMuted, textAlign: 'center', paddingVertical: 40 }}>No orders for {MONTHS[month - 1]} {year}.</Text>
        ) : (
          <View style={{ backgroundColor: t.bgElev, borderRadius: 16, borderColor: t.border, borderWidth: 1, overflow: 'hidden', ...t.shadow1 }}>
            {filtered.map((o, i) => {
              const it = o.items[0];
              const open = !!expanded[o.id];
              return (
                <View key={o.id} style={{ borderBottomWidth: i === filtered.length - 1 ? 0 : 1, borderBottomColor: t.border }}>
                  <Pressable onPress={() => toggle(o.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                    {it?.countryCode ? <Flag iso={it.countryCode} size={34} /> : (
                      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={18} color={t.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
                        {o.user?.name || 'Unknown'} <Text style={{ color: t.fgMuted, fontWeight: '400' }}>· {o.user?.phone || ''}</Text>
                      </Text>
                      <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                        {it?.countryName || it?.countryCode || 'eSIM'}{orderDate(o) ? ` · ${new Date(orderDate(o)).toLocaleDateString()}` : ''}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: t.bgSunken }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: t.fgMuted, letterSpacing: 0.3 }}>
                            {(ESIM_LABEL[o.esimStatus] || o.esimStatus).toUpperCase()}
                          </Text>
                        </View>
                        {o.paymentMethod ? <Text style={{ fontSize: 10, color: t.fgFaint }}>{o.paymentMethod}</Text> : null}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg }}>{formatIqd(o.totalMinor ?? 0)}</Text>
                      <ChevronDown size={16} color={t.fgFaint} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
                    </View>
                  </Pressable>
                  {open && (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingLeft: 60, gap: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: t.fgMuted, letterSpacing: 0.4 }}>
                        BUNDLE{o.items.length > 1 ? `S (${o.items.length})` : ''} · ORDER {o.orderNumber}
                      </Text>
                      {o.items.map((item) => {
                        const data = item.unlimited ? 'Unlimited' : item.dataGb ? `${item.dataGb} GB` : null;
                        const spec = [data, item.validityDays ? `${item.validityDays} days` : null]
                          .filter(Boolean)
                          .join(' · ') || 'eSIM bundle';
                        return (
                          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {item.countryCode ? <Flag iso={item.countryCode} size={20} /> : null}
                            <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: t.fg, fontFamily: t.font.bodyMedium }}>
                              {spec}
                            </Text>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: t.fg }}>{formatIqd(item.salePriceMinor ?? 0)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
