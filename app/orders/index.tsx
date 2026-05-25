import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Receipt, Globe } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PressableScale } from '@/components/PressableScale';
import { StatusPill } from '@/components/StatusPill';
import { useOrderStore } from '@/state/orderStore';
import { CURRENCIES, formatMoney } from '@/data/currency';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Orders() {
  const t = useTheme();
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);

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

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10, maxWidth: 780, width: '100%', alignSelf: 'center' }}>
        {orders.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={30} color={t.fgMuted} strokeWidth={2} />
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>No orders yet</Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>
              Your purchases will appear here.
            </Text>
          </View>
        ) : (
          orders.map((o) => (
            <PressableScale
              key={o.id}
              onPress={() => router.push(`/orders/${o.id}`)}
              scaleTo={0.98}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 14,
                borderRadius: 16,
                backgroundColor: t.bgElev,
                borderColor: t.border,
                borderWidth: 1,
                ...t.shadow1,
              }}
            >
              {o.iso ? <Flag iso={o.iso} size={36} /> : <Globe size={28} color={t.primary} />}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>
                  {o.title}
                </Text>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                  {fmtDate(o.date)} · {o.subtitle}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <StatusPill kind={o.status === 'paid' ? 'completed' : 'upcoming'} label={o.status} />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                  {formatMoney(o.amountUsd, CURRENCIES[o.currencyCode])}
                </Text>
                <ChevronRight size={16} color={t.fgFaint} />
              </View>
            </PressableScale>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
