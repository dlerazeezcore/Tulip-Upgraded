import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { ChevronLeft, Send, Check, Bell } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAdminStore } from '@/state/adminStore';
import { PUSH_AUDIENCES } from '@/data/admin';

export default function AdminNotifications() {
  const t = useTheme();
  const router = useRouter();
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState(PUSH_AUDIENCES[0]);
  const [sent, setSent] = useState(false);

  if (!isAdmin) return <Redirect href="/(tabs)/profile" />;

  const inputStyle = {
    backgroundColor: t.bgElev,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: t.fg,
    fontFamily: t.font.bodyMedium,
  } as const;

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
          Push notifications
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {/* Live preview */}
        <View style={{ padding: 14, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, flexDirection: 'row', gap: 12, ...t.shadow1 }}>
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
              {title || 'Notification title'}
            </Text>
            <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>
              {body || 'Your message preview appears here.'}
            </Text>
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Weekend eSIM sale" placeholderTextColor={t.fgFaint} style={inputStyle} />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Message</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write your message…"
            placeholderTextColor={t.fgFaint}
            multiline
            style={{ ...inputStyle, height: 100, textAlignVertical: 'top' }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Audience</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PUSH_AUDIENCES.map((a) => {
              const on = a === audience;
              return (
                <Pressable
                  key={a}
                  onPress={() => setAudience(a)}
                  style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? t.primary : t.bgSunken }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: t.font.displayMedium, color: on ? '#fff' : t.fgMuted }}>
                    {a}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {sent ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, backgroundColor: 'rgba(22,163,74,0.12)' }}>
            <Check size={16} color={t.success} strokeWidth={2.5} />
            <Text style={{ color: t.success, fontWeight: '700' }}>Sent to “{audience}” (demo)</Text>
          </View>
        ) : (
          <PrimaryButton
            label="Send notification"
            icon={<Send size={15} color="#fff" strokeWidth={2.2} />}
            onPress={() => setSent(true)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
