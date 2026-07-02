// THIN UI — wiring lives in src/screens/admin/useAdminOrders.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, RefreshCw, Check, AlertCircle } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import type { AdminOrder } from '@/services/types';
import { formatIqd } from '@/lib/pricing';
import { useAdminOrders } from '@/screens/admin/useAdminOrders';

const YEARS = [2026, 2027, 2028, 2029, 2030];
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
const ESIM_FILTER_IDS = ['all', 'installed', 'not_installed', 'expired', 'used'] as const;

function orderDate(o: AdminOrder): string {
  return o.bookedAt || o.createdAt || '';
}

export default function AdminOrders() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useAdminOrders();
  const {
    year, month, esim, setYear, setMonth, setEsim,
    orders, filtered, loading, error,
    expanded, toggle,
    refreshing, refreshSummary, onRefreshFromProvider,
  } = vm;

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const monthLabel = (m: number) => tr(`admin.orders.months.${MONTH_KEYS[m - 1]}`);
  const esimLabel = (id: string) => tr(`admin.orders.esimStatus.${id}`, { defaultValue: id });

  const labelStyle = { fontSize: 11, fontWeight: '700' as const, color: t.fgMuted, textTransform: 'uppercase' as const, letterSpacing: 0.4 };
  const Chip = ({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? t.primary : t.bgSunken }}>
      <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 12, color: on ? t.onPrimary : t.fgMuted }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.back')}
          hitSlop={4} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          {tr('admin.orders.title')}{month !== null && !loading ? ` · ${orders.length}` : ''}
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
            {refreshing ? tr('admin.orders.refreshing') : tr('admin.orders.refreshFromProvider')}
          </Text>
        </Pressable>
      </View>

      {refreshSummary && (
        <View style={{ marginHorizontal: 20, marginTop: 4, padding: 10, borderRadius: 12, backgroundColor: refreshSummary.errorCount > 0 ? t.warningBg : t.successBg, borderWidth: 1, borderColor: refreshSummary.errorCount > 0 ? `${t.warning}59` : `${t.success}59`, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {refreshSummary.errorCount > 0 ? (
            <AlertCircle size={14} color={t.warning} />
          ) : (
            <Check size={14} color={t.success} strokeWidth={2.5} />
          )}
          <Text style={{ flex: 1, fontSize: 11, color: t.fg }}>
            {tr('admin.orders.syncSummary', {
              count: refreshSummary.attempted,
              updated: refreshSummary.activeRefreshed,
              recovered: refreshSummary.placeholdersRecovered,
            })}
            {refreshSummary.errorCount > 0
              ? tr('admin.orders.syncErrors', { count: refreshSummary.errorCount })
              : ''}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14, maxWidth: 820, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: 8 }}>
          <Text style={labelStyle}>{tr('admin.orders.year')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {YEARS.map((y) => <Chip key={y} on={year === y} label={String(y)} onPress={() => setYear(y)} />)}
          </ScrollView>
          <Text style={[labelStyle, { marginTop: 4 }]}>{tr('admin.orders.month')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {MONTH_KEYS.map((m, i) => <Chip key={m} on={month === i + 1} label={monthLabel(i + 1)} onPress={() => setMonth(i + 1)} />)}
          </ScrollView>
          {month !== null && (
            <>
              <Text style={[labelStyle, { marginTop: 4 }]}>{tr('admin.orders.esimStatusLabel')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {ESIM_FILTER_IDS.map((id) => <Chip key={id} on={esim === id} label={tr(`admin.orders.filters.${id}`)} onPress={() => setEsim(id)} />)}
              </ScrollView>
            </>
          )}
        </View>

        {month === null ? (
          <Text style={{ color: t.fgMuted, textAlign: 'center', paddingVertical: 40 }}>{tr('admin.orders.selectYearMonth')}</Text>
        ) : loading ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
        ) : error ? (
          <Text style={{ color: t.danger, textAlign: 'center', paddingVertical: 20 }}>{error}</Text>
        ) : filtered.length === 0 ? (
          <Text style={{ color: t.fgMuted, textAlign: 'center', paddingVertical: 40 }}>{tr('admin.orders.noOrdersForMonth', { month: monthLabel(month), year })}</Text>
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
                        {o.user?.name || tr('admin.orders.unknownUser')} <Text style={{ color: t.fgMuted, fontWeight: '400' }}>· {o.user?.phone || ''}</Text>
                      </Text>
                      <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                        {it?.countryName || it?.countryCode || tr('admin.orders.esim')}{orderDate(o) ? ` · ${new Date(orderDate(o)).toLocaleDateString()}` : ''}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: t.bgSunken }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: t.fgMuted, letterSpacing: 0.3 }}>
                            {esimLabel(o.esimStatus).toUpperCase()}
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
                    <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingStart: 60, gap: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: t.fgMuted, letterSpacing: 0.4 }}>
                        {tr('admin.orders.bundleHeader', { count: o.items.length })} · {tr('admin.orders.orderLabel', { number: o.orderNumber })}
                      </Text>
                      {o.items.map((item) => {
                        const data = item.unlimited ? tr('admin.orders.unlimited') : item.dataGb ? `${item.dataGb} GB` : null;
                        const spec = [data, item.validityDays ? tr('admin.orders.daysCount', { count: item.validityDays }) : null]
                          .filter(Boolean)
                          .join(' · ') || tr('admin.orders.esimBundle');
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
