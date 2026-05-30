// THIN UI — wiring lives in src/screens/admin/notifications/useNotificationsLanding.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PressableScale } from '@/components/PressableScale';
import { useNotificationsLanding } from '@/screens/admin/notifications/useNotificationsLanding';

export default function AdminNotificationsLanding() {
  const t = useTheme();
  const router = useRouter();
  const vm = useNotificationsLanding();

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

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
          <Bell size={20} color={t.primary} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            Push notifications
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {vm.cards.map((c) => (
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
              <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{c.subtitle}</Text>
            </View>
            <ChevronRight size={18} color={t.fgFaint} />
          </PressableScale>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
