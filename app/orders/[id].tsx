import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Globe, Check } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { StatusPill } from '@/components/StatusPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useOrderStore } from '@/state/orderStore';
import { CURRENCIES, formatMoney } from '@/data/currency';

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === id));

  const money = (usd: number) => (order ? formatMoney(usd, CURRENCIES[order.currencyCode]) : '');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          Order detail
        </Text>
      </View>

      {!order ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ color: t.fgMuted }}>Order not found.</Text>
          <PrimaryButton label="Back to orders" onPress={() => router.replace('/orders')} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          {/* Header card */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
            {order.iso ? <Flag iso={order.iso} size={42} /> : <Globe size={32} color={t.primary} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg }}>{order.title}</Text>
              <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{order.subtitle}</Text>
              <View style={{ marginTop: 6 }}>
                <StatusPill kind={order.status === 'paid' ? 'completed' : 'upcoming'} label={order.status} />
              </View>
            </View>
          </View>

          {/* Details */}
          <View style={{ backgroundColor: t.bgElev, borderRadius: 16, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
            {[
              ['Order ID', order.id.replace('ord_', '#')],
              ['Date', fmtDateTime(order.date)],
              ['Payment method', order.paymentMethod],
              ['Currency', `${CURRENCIES[order.currencyCode].name} (${order.currencyCode})`],
              ...order.lines.map((l) => [l.label, l.value] as [string, string]),
            ].map(([k, v], i, arr) => (
              <View
                key={k + i}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: t.border,
                }}
              >
                <Text style={{ fontSize: 13, color: t.fgMuted }}>{k}</Text>
                <Text style={{ fontSize: 13, color: t.fg, fontWeight: '600', fontFamily: t.font.bodyMedium, maxWidth: '60%', textAlign: 'right' }}>
                  {v}
                </Text>
              </View>
            ))}
          </View>

          {/* Total */}
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>Total paid</Text>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 20, color: t.fg }}>{money(order.amountUsd)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Check size={14} color={t.success} strokeWidth={2.5} />
              <Text style={{ fontSize: 12, color: t.success, fontWeight: '600' }}>Payment successful</Text>
            </View>
          </View>

          {order.kind === 'esim' && (
            <PrimaryButton label="Manage eSIM" onPress={() => router.replace('/manage/esim')} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
