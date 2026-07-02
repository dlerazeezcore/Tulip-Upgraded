// THIN UI — wiring lives in src/screens/orders/useOrderDetail.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe, Check } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { StatusPill } from '@/components/StatusPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { formatIqd } from '@/lib/pricing';
import { useOrderDetail } from '@/screens/orders/useOrderDetail';
import { useIsRTL } from '@/lib/rtl';

function fmtDateTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderDetail() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useOrderDetail();
  const isRTL = useIsRTL();
  const { order, item, completed } = vm;

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
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          Order detail
        </Text>
      </View>

      {!order ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ color: t.fgMuted }}>Order not found.</Text>
          <PrimaryButton label="Back to orders" onPress={vm.goOrders} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
            {item?.countryCode ? <Flag iso={item.countryCode} size={42} /> : <Globe size={32} color={t.primary} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg }}>
                {item?.countryName ? `${item.countryName} eSIM` : 'eSIM order'}
              </Text>
              {item?.packageName ? <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{item.packageName}</Text> : null}
              <View style={{ marginTop: 6 }}>
                <StatusPill kind={completed ? 'completed' : 'upcoming'} label={String(order.status).toLowerCase()} />
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: t.bgElev, borderRadius: 16, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
            {([
              ['Order number', order.orderNumber],
              ['Date', fmtDateTime(order.bookedAt || order.createdAt)],
              ['Payment method', order.paymentMethod || '—'],
              ['Destination', item?.countryName || '—'],
              ['Plan', item?.packageName || item?.packageCode || '—'],
              ['Quantity', String(item?.quantity ?? 1)],
            ] as [string, string][]).map(([k, v], i, arr) => (
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

          <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>{tr('orders.total')}</Text>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 20, color: t.fg }}>{formatIqd(order.totalMinor ?? 0)}</Text>
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
    </SafeAreaView>
  );
}
