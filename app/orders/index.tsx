// THIN UI — wiring lives in src/screens/orders/useOrders.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Receipt, Globe } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState } from '@/components/EmptyState';
import { OrderListSkeleton } from '@/components/Skeleton';
import { useOrders } from '@/screens/orders/useOrders';

export default function Orders() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useOrders();

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
          {tr('orders.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20, maxWidth: 780, width: '100%', alignSelf: 'center' }}>
        {vm.loading && !vm.loaded ? (
          <OrderListSkeleton />
        ) : vm.orders.length === 0 ? (
          <EmptyState icon={Receipt} title={tr('orders.noOrdersTitle')} subtitle={tr('orders.noOrdersSub')} />
        ) : (
          vm.groups.map((g) => (
            <View key={g.label} style={{ gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 4 }}>
                {g.label}
              </Text>
              <View style={{ backgroundColor: t.bgElev, borderRadius: 16, borderColor: t.border, borderWidth: 1, overflow: 'hidden', ...t.shadow1 }}>
                {g.items.map((o, i) => (
                  <Pressable
                    key={o.id}
                    onPress={() => vm.goOrder(o.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
                      borderBottomWidth: i === g.items.length - 1 ? 0 : 1, borderBottomColor: t.border, opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    {o.countryCode ? <Flag iso={o.countryCode} size={38} /> : (
                      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={20} color={t.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>{o.title}</Text>
                      {o.packageName ? <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{o.packageName}</Text> : null}
                      <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 2 }}>
                        {o.dateLabel}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                        {o.totalLabel}
                      </Text>
                      <StatusPill kind={o.completed ? 'completed' : 'upcoming'} label={o.statusLabel} />
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
