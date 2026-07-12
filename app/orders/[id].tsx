// THIN UI — wiring lives in src/screens/orders/useOrderDetail.ts.
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Globe, Check, Receipt } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StackHeader } from '@/components/StackHeader';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { StatusPill } from '@/components/StatusPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useOrderDetail } from '@/screens/orders/useOrderDetail';
import { useIsRTL } from '@/lib/rtl';

export default function OrderDetail() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useOrderDetail();
  const isRTL = useIsRTL();
  const { order, item, completed } = vm;

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      <StackHeader title={tr('orders.detailTitle')} onBack={vm.goBack} />

      {vm.loading ? (
        <View style={{ padding: 20, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          {/* Shaped like the summary + rows cards so the loaded screen doesn't jump. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: t.radius.card, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
            <Skeleton width={42} height={42} radius={21} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="55%" height={14} />
              <Skeleton width="35%" height={11} />
              <Skeleton width={72} height={22} radius={t.radius.pill} />
            </View>
          </View>
          <View style={{ backgroundColor: t.bgElev, borderRadius: t.radius.card, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
            {[0, 1, 2, 3, 4, 5].map((i, _, arr) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 14,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: t.border,
                }}
              >
                <Skeleton width={90} height={13} />
                <Skeleton width={120} height={13} />
              </View>
            ))}
          </View>
        </View>
      ) : !order ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon={Receipt}
            title={tr('orders.notFound')}
            action={<PrimaryButton label={tr('orders.backToOrders')} onPress={vm.goOrders} />}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: t.radius.card, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
            {item?.countryCode ? <Flag iso={item.countryCode} size={42} /> : <Globe size={32} color={t.primary} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg }}>
                {vm.title}
              </Text>
              {item?.packageName ? <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{item.packageName}</Text> : null}
              <View style={{ marginTop: 6 }}>
                <StatusPill kind={completed ? 'completed' : 'upcoming'} label={vm.statusLabel} />
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: t.bgElev, borderRadius: t.radius.card, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
            {vm.rows.map(([k, v], i, arr) => (
              <View
                key={k + i}
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 14,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: t.border,
                }}
              >
                <Text style={{ fontSize: 13, color: t.fgMuted }}>{k}</Text>
                <Text style={{ fontSize: 13, color: t.fg, fontWeight: '600', fontFamily: t.font.bodyMedium, maxWidth: '60%', textAlign: isRTL ? 'left' : 'right' }}>{v}</Text>
              </View>
            ))}
          </View>

          <View style={{ padding: 16, borderRadius: t.radius.card, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>{tr('orders.total')}</Text>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 20, color: t.fg }}>{vm.totalLabel}</Text>
            </View>
            {completed && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <Check size={14} color={t.success} strokeWidth={2.5} />
                <Text style={{ fontSize: 12, color: t.success, fontWeight: '600' }}>{tr('orders.confirmed')}</Text>
              </View>
            )}
          </View>

          <PrimaryButton label={tr('orders.manageEsim')} onPress={vm.goManageEsim} />
        </ScrollView>
      )}
    </ScreenSafeArea>
  );
}
