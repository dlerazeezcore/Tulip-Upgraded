import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { ChevronLeft, Search, Star } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/state/authStore';
import { ADMIN_USERS } from '@/data/admin';

export default function AdminUsers() {
  const t = useTheme();
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const [q, setQ] = useState('');

  const users = useMemo(
    () => ADMIN_USERS.filter((u) => (u.name + u.phone).toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  if (!isAdmin) return <Redirect href="/(tabs)/profile" />;

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
          Users · {ADMIN_USERS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12, maxWidth: 780, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: t.bgSunken }}>
          <Search size={18} color={t.fgMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search users"
            placeholderTextColor={t.fgFaint}
            style={{ flex: 1, fontSize: 14, color: t.fg, fontFamily: t.font.bodyMedium, paddingVertical: 2 }}
          />
        </View>

        <View style={{ backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
          {users.map((u, i) => (
            <View
              key={u.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderBottomWidth: i === users.length - 1 ? 0 : 1,
                borderBottomColor: t.border,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 14, color: t.fg }}>
                  {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{u.name}</Text>
                  {u.tier === 'TULIP+' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(25,103,210,0.12)' }}>
                      <Star size={9} color={t.primary} fill={t.primary} />
                      <Text style={{ fontSize: 9, fontWeight: '800', color: t.primary }}>TULIP+</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{u.phone}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: t.fg }}>{u.orders}</Text>
                <Text style={{ fontSize: 10, color: t.fgMuted }}>orders</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
