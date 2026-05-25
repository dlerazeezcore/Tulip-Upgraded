import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Flag } from '@/components/Flag';
import { useAuthStore } from '@/state/authStore';
import { CURRENCY_LIST } from '@/data/currency';

type Rules = Record<string, { markup: string; discount: string }>;

export default function AdminCurrency() {
  const t = useTheme();
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const [rules, setRules] = useState<Rules>(
    Object.fromEntries(CURRENCY_LIST.map((c) => [c.code, { markup: '0', discount: '0' }])),
  );
  const [saved, setSaved] = useState(false);

  if (!isAdmin) return <Redirect href="/(tabs)/profile" />;

  const set = (code: string, key: 'markup' | 'discount', v: string) => {
    setRules((r) => ({ ...r, [code]: { ...r[code], [key]: v.replace(/[^\d.]/g, '') } }));
    setSaved(false);
  };

  const numStyle = {
    flex: 1,
    backgroundColor: t.bgElev,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
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
          Currency & markup
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <Text style={{ fontSize: 12, color: t.fgMuted }}>
          Set a markup or promotional discount per currency. Applied on top of the base FX rate.
        </Text>

        {CURRENCY_LIST.map((c) => (
          <View key={c.code} style={{ padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, gap: 12, ...t.shadow1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Flag iso={c.flag} size={30} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>
                  {c.code} · {c.name}
                </Text>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                  Base rate: 1 USD = {c.rate} {c.code}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>Markup %</Text>
                <TextInput value={rules[c.code].markup} onChangeText={(v) => set(c.code, 'markup', v)} keyboardType="decimal-pad" style={numStyle} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>Discount %</Text>
                <TextInput value={rules[c.code].discount} onChangeText={(v) => set(c.code, 'discount', v)} keyboardType="decimal-pad" style={numStyle} />
              </View>
            </View>
          </View>
        ))}

        {saved ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, backgroundColor: 'rgba(22,163,74,0.12)' }}>
            <Check size={16} color={t.success} strokeWidth={2.5} />
            <Text style={{ color: t.success, fontWeight: '700' }}>Saved (demo)</Text>
          </View>
        ) : (
          <PrimaryButton label="Save rules" onPress={() => setSaved(true)} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
