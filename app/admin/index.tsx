import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { ChevronLeft, ChevronRight, Users, Bell, Coins, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PressableScale } from '@/components/PressableScale';
import { useAuthStore } from '@/state/authStore';
import { ADMIN_USERS } from '@/data/admin';

export default function AdminHome() {
  const t = useTheme();
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);

  if (!isAdmin) return <Redirect href="/(tabs)/profile" />;

  const cards = [
    { id: 'users', title: 'Users', sub: `${ADMIN_USERS.length} signed up`, Icon: Users, color: '#1967D2', route: '/admin/users' },
    { id: 'notif', title: 'Push notifications', sub: 'Compose & send', Icon: Bell, color: '#7C3AED', route: '/admin/notifications' },
    { id: 'cur', title: 'Currency & markup', sub: 'Rates, markup, discounts', Icon: Coins, color: '#10B981', route: '/admin/currency' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={20} color={t.primary} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>Admin panel</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12, maxWidth: 780, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            backgroundColor: 'rgba(245,158,11,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(245,158,11,0.3)',
          }}
        >
          <Text style={{ fontSize: 12, color: t.warning, fontWeight: '700' }}>
            Demo mode — data is mock. Live admin actions arrive with the backend.
          </Text>
        </View>

        {cards.map((c) => (
          <PressableScale
            key={c.id}
            onPress={() => router.push(c.route as any)}
            scaleTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              borderRadius: 16,
              backgroundColor: t.bgElev,
              borderColor: t.border,
              borderWidth: 1,
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
            <ChevronRight size={18} color={t.fgFaint} />
          </PressableScale>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
