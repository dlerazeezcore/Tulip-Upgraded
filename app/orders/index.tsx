// THIN UI — wiring lives in src/screens/orders/useOrders.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Receipt, Globe } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { StatusPill } from '@/components/StatusPill';
import type { OrderSummary } from '@/services/types';
import { formatIqd } from '@/lib/pricing';
import { useOrders } from '@/screens/orders/useOrders';

function orderDate(o: OrderSummary): string {
  return o.bookedAt || o.createdAt || new Date().toISOString();
}
function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Orders() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useOrders();
  const orderTitle = (o: OrderSummary): string => {
    const it = o.items[0];
    return it?.countryName ? tr('orders.countryEsim', { country: it.countryName }) : tr('orders.esimOrder');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.back')}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          {tr('orders.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20, maxWidth: 780, width: '100%', alignSelf: 'center' }}>
        {vm.loading && !vm.loaded ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
        ) : vm.orders.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={30} color={t.fgMuted} strokeWidth={2} />
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>{tr('orders.noOrdersTitle')}</Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>{tr('orders.noOrdersSub')}</Text>
          </View>
        ) : (
          vm.groups.map((g) => (
            <View key={g.label} style={{ gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 4 }}>
                {g.label}
              </Text>
              <View style={{ backgroundColor: t.bgElev, borderRadius: 16, borderColor: t.border, borderWidth: 1, overflow: 'hidden', ...t.shadow1 }}>
                {g.items.map((o, i) => {
                  const it = o.items[0];
                  const completed = ['BOOKED', 'ACTIVE', 'COMPLETED', 'GOT_RESOURCE'].includes(String(o.status).toUpperCase());
                  return (
                    <Pressable
                      key={o.id}
                      onPress={() => vm.goOrder(o.id)}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
                        borderBottomWidth: i === g.items.length - 1 ? 0 : 1, borderBottomColor: t.border, opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      {it?.countryCode ? <Flag iso={it.countryCode} size={38} /> : (
                        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                          <Globe size={20} color={t.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>{orderTitle(o)}</Text>
                        {it?.packageName ? <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{it.packageName}</Text> : null}
                        <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 2 }}>
                          {dayLabel(orderDate(o))}{o.paymentMethod ? ` · ${o.paymentMethod}` : ''}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                          {formatIqd(o.totalMinor ?? 0)}
                        </Text>
                        <StatusPill kind={completed ? 'completed' : 'upcoming'} label={tr(`status.${String(o.status).toLowerCase()}`, { defaultValue: String(o.status) })} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
