import React, { useMemo } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Receipt, Globe } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PressableScale } from '@/components/PressableScale';
import { StatusPill } from '@/components/StatusPill';
import { useOrderStore, type Order } from '@/state/orderStore';
import { CURRENCIES, formatMoney } from '@/data/currency';

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}
function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Orders() {
  const t = useTheme();
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);

  // Group newest-first orders by month, preserving order.
  const groups = useMemo(() => {
    const out: { label: string; items: Order[] }[] = [];
    for (const o of orders) {
      const label = monthLabel(o.date);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(o);
      else out.push({ label, items: [o] });
    }
    return out;
  }, [orders]);

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
          Order history
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20, maxWidth: 780, width: '100%', alignSelf: 'center' }}>
        {orders.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={30} color={t.fgMuted} strokeWidth={2} />
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>No orders yet</Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>Your purchases will appear here.</Text>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.label} style={{ gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 4 }}>
                {g.label}
              </Text>
              <View style={{ backgroundColor: t.bgElev, borderRadius: 16, borderColor: t.border, borderWidth: 1, overflow: 'hidden', ...t.shadow1 }}>
                {g.items.map((o, i) => (
                  <Pressable
                    key={o.id}
                    onPress={() => router.push(`/orders/${o.id}`)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      padding: 14,
                      borderBottomWidth: i === g.items.length - 1 ? 0 : 1,
                      borderBottomColor: t.border,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    {o.iso ? <Flag iso={o.iso} size={38} /> : (
                      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={20} color={t.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>
                        {o.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{o.subtitle}</Text>
                      <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 2 }}>
                        {dayLabel(o.date)} · {o.paymentMethod}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                        {formatMoney(o.amountUsd, CURRENCIES[o.currencyCode])}
                      </Text>
                      <StatusPill kind={o.status === 'paid' ? 'completed' : 'upcoming'} label={o.status} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
