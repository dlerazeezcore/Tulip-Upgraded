// THIN UI — wiring lives in src/screens/admin/useAdminOrders.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, RefreshCw, Check, AlertCircle, CalendarDays, Receipt } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { EmptyState } from '@/components/EmptyState';
import { OrderListSkeleton } from '@/components/Skeleton';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useAdminOrders } from '@/screens/admin/useAdminOrders';

const YEARS = [2026, 2027, 2028, 2029, 2030];
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
const ESIM_FILTER_IDS = ['all', 'installed', 'not_installed', 'expired', 'used'] as const;

export default function AdminOrders() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useAdminOrders();
  const {
    year, month, esim, setYear, setMonth, setEsim,
    orders, filtered, loading, error, toggle,
    refreshing, refreshSummary, onRefreshFromProvider,
  } = vm;

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const monthLabel = (m: number) => tr(`admin.orders.months.${MONTH_KEYS[m - 1]}`);

  const labelStyle = { fontSize: 11, fontWeight: '700' as const, color: t.fgMuted, textTransform: 'uppercase' as const, letterSpacing: 0.4 };
  const Chip = ({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: t.radius.pill, backgroundColor: on ? t.primary : t.bgSunken }}>
      <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 12, color: on ? t.onPrimary : t.fgMuted }}>{label}</Text>
    </Pressable>
  );

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.back')}
          hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
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
            borderRadius: t.radius.pill,
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
        <View style={{ marginHorizontal: 20, marginTop: 4, padding: 10, borderRadius: t.radius.md, backgroundColor: refreshSummary.errorCount > 0 ? t.warningBg : t.successBg, borderWidth: 1, borderColor: refreshSummary.errorCount > 0 ? `${t.warning}59` : `${t.success}59`, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
          <EmptyState icon={CalendarDays} title={tr('admin.orders.selectYearMonth')} />
        ) : loading ? (
          <OrderListSkeleton />
        ) : error ? (
          <EmptyState icon={AlertCircle} title={tr('common.error')} subtitle={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Receipt} title={tr('admin.orders.noOrdersForMonth', { month: monthLabel(month), year })} />
        ) : (
          <View style={{ backgroundColor: t.bgElev, borderRadius: t.radius.card, borderColor: t.border, borderWidth: 1, overflow: 'hidden', ...t.shadow1 }}>
            {filtered.map((o, i) => (
              <View key={o.id} style={{ borderBottomWidth: i === filtered.length - 1 ? 0 : 1, borderBottomColor: t.border }}>
                <Pressable onPress={() => toggle(o.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                  {o.countryCode ? <Flag iso={o.countryCode} size={34} /> : (
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={18} color={t.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
                      {o.userName} <Text style={{ color: t.fgMuted, fontWeight: '400' }}>· {o.userPhone}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                      {o.subLabel}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: t.radius.pill, backgroundColor: t.bgSunken }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: t.fgMuted, letterSpacing: 0.3 }}>
                          {o.statusLabel}
                        </Text>
                      </View>
                      {o.paymentMethod ? <Text style={{ fontSize: 10, color: t.fgFaint }}>{o.paymentMethod}</Text> : null}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg }}>{o.totalLabel}</Text>
                    <ChevronDown size={16} color={t.fgFaint} style={{ transform: [{ rotate: o.expanded ? '180deg' : '0deg' }] }} />
                  </View>
                </Pressable>
                {o.expanded && (
                  <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingStart: 60, gap: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: t.fgMuted, letterSpacing: 0.4 }}>
                      {tr('admin.orders.bundleHeader', { count: o.itemCount })} · {tr('admin.orders.orderLabel', { number: o.orderNumber })}
                    </Text>
                    {o.lines.map((item) => (
                      <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {item.countryCode ? <Flag iso={item.countryCode} size={20} /> : null}
                        <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: t.fg, fontFamily: t.font.bodyMedium }}>
                          {item.specLabel}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: t.fg }}>{item.priceLabel}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
}
