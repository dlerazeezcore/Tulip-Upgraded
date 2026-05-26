import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/state/authStore';
import { useCurrencyStore } from '@/state/currencyStore';
import { getExchangeSettings } from '@/services/esim';
import { saveExchangeRate } from '@/services/admin';
import { usdToIqd } from '@/lib/pricing';

export default function AdminCurrency() {
  const t = useTheme();
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const loadExchange = useCurrencyStore((s) => s.loadExchange);

  const [rate, setRate] = useState('');
  const [markup, setMarkup] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExchangeSettings()
      .then((s) => {
        setRate(String(s.exchangeRate ?? ''));
        setMarkup(String(s.markupPercent ?? '0'));
      })
      .catch((e: any) => setError(e?.message || 'Failed to load current rate'))
      .finally(() => setLoading(false));
  }, []);

  if (!isAdmin) return <Redirect href="/(tabs)/profile" />;

  const rateNum = parseFloat(rate) || 0;
  const markupNum = parseFloat(markup) || 0;
  const preview = usdToIqd(1, rateNum * (1 + markupNum / 100)); // $1 → IQD B2C, rounded

  const numStyle = {
    backgroundColor: t.bgElev,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: t.fg,
    fontFamily: t.font.bodyMedium,
  } as const;

  const onSave = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await saveExchangeRate({ rate: rateNum, markupPercent: markupNum });
      await loadExchange();
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

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
          Exchange rate & markup
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <Text style={{ fontSize: 12, color: t.fgMuted }}>
          The USD→IQD rate and markup applied to every eSIM price. Saving updates prices across the app immediately.
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator color={t.primary} />
          </View>
        ) : (
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, gap: 14, ...t.shadow1 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>USD → IQD rate</Text>
              <TextInput value={rate} onChangeText={(v) => { setRate(v.replace(/[^\d.]/g, '')); setSaved(false); }} keyboardType="decimal-pad" placeholder="1550" placeholderTextColor={t.fgFaint} style={numStyle} />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>Markup %</Text>
              <TextInput value={markup} onChangeText={(v) => { setMarkup(v.replace(/[^\d.]/g, '')); setSaved(false); }} keyboardType="decimal-pad" placeholder="100" placeholderTextColor={t.fgFaint} style={numStyle} />
            </View>
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: t.bgSunken }}>
              <Text style={{ fontSize: 12, color: t.fgMuted }}>Preview: a $1 plan sells for</Text>
              <Text style={{ fontFamily: t.font.display, fontWeight: '800', fontSize: 20, color: t.fg }}>
                {preview.toLocaleString('en-US')} IQD
              </Text>
              <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 2 }}>rounded to nearest 250</Text>
            </View>
          </View>
        )}

        {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}

        {saved ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, backgroundColor: 'rgba(22,163,74,0.12)' }}>
            <Check size={16} color={t.success} strokeWidth={2.5} />
            <Text style={{ color: t.success, fontWeight: '700' }}>Saved — prices updated</Text>
          </View>
        ) : (
          <PrimaryButton label={busy ? 'Saving…' : 'Save rate'} onPress={onSave} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
