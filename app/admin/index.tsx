// THIN UI — wiring lives in src/screens/admin/useAdminHome.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { ChevronLeft, ChevronRight, Users, Bell, Coins, ShieldCheck, MapPin, Receipt } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PressableScale } from '@/components/PressableScale';
import { useAdminHome } from '@/screens/admin/useAdminHome';

export default function AdminHome() {
  const t = useTheme();
  const vm = useAdminHome();
  const isWide = vm.isWide;

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const cards = [
    { id: 'users', title: 'Users', sub: vm.userCount === null ? 'View signups' : `${vm.userCount} signed up`, Icon: Users, color: t.accent.blue, route: '/admin/users' },
    { id: 'orders', title: 'Order history', sub: 'All users · filter by month', Icon: Receipt, color: t.accent.sky, route: '/admin/orders' },
    { id: 'featured', title: 'Popular destinations', sub: vm.featuredCount === null ? 'Add, edit, remove' : `${vm.featuredCount} configured`, Icon: MapPin, color: t.accent.amber, route: '/admin/featured' },
    { id: 'notif', title: 'Push notifications', sub: 'Compose & send', Icon: Bell, color: t.accent.purple, route: '/admin/notifications' },
    { id: 'cur', title: 'Exchange rate & markup', sub: 'USD→IQD rate, markup', Icon: Coins, color: t.accent.emerald, route: '/admin/currency' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={20} color={t.primary} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>Admin panel</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 40, gap: 12, maxWidth: isWide ? 1000 : 780, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: isWide ? 'row' : 'column', flexWrap: 'wrap', marginHorizontal: isWide ? -6 : 0, gap: isWide ? 0 : 12 }}>
          {cards.map((c) => (
            <View key={c.id} style={{ width: isWide ? '33.333%' : '100%', padding: isWide ? 6 : 0 }}>
            <PressableScale
              onPress={() => vm.goRoute(c.route)}
              scaleTo={0.98}
              style={{
                flexDirection: isWide ? 'column' : 'row',
                alignItems: isWide ? 'flex-start' : 'center',
                gap: isWide ? 12 : 14,
                padding: 16,
                borderRadius: 16,
                backgroundColor: t.bgElev,
                borderColor: t.border,
                borderWidth: 1,
                minHeight: isWide ? 140 : undefined,
                ...t.shadow1,
              }}
            >
              <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: `${c.color}1A`, alignItems: 'center', justifyContent: 'center' }}>
                <c.Icon size={22} color={c.color} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>{c.title}</Text>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{c.sub}</Text>
              </View>
              {!isWide && <ChevronRight size={18} color={t.fgFaint} />}
            </PressableScale>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
