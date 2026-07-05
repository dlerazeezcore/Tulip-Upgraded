// THIN UI — wiring lives in src/screens/admin/notifications/useCustomNotification.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Send, Check, Copy } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useCustomNotification } from '@/screens/admin/notifications/useCustomNotification';

export default function AdminSendCustomNotification() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useCustomNotification();

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const inputStyle = {
    backgroundColor: t.bgElev,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: t.fg,
    fontFamily: t.font.body,
  } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={vm.goBack} accessibilityRole="button" accessibilityLabel={tr('a11y.back')} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Send size={20} color={t.primary} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            {tr('admin.notifications.custom.title')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        {/* Audience picker */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>{tr('admin.notifications.custom.audience')}</Text>
        <View style={{ gap: 8 }}>
          {vm.audienceOptions.map((opt) => {
            const selected = vm.audience === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => vm.setAudience(opt.value)}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: t.bgElev,
                  borderColor: selected ? t.primary : t.border,
                  borderWidth: selected ? 1.5 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: selected ? t.primary : t.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.primary }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: t.fg }}>{opt.label}</Text>
                  <Text style={{ fontSize: 11, color: t.fgMuted, marginTop: 2 }}>{opt.subtitle}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* 3-language form */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>
          {tr('admin.notifications.messageLangs')}
        </Text>
        <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: -8 }}>
          {tr('admin.notifications.custom.langHint')}
        </Text>

        {vm.langs.map(({ code, label }) => (
          <View key={code} style={{ padding: 14, borderRadius: 14, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', color: t.fg }}>{label}</Text>
              {code !== 'en' && (
                <Pressable onPress={() => vm.copyFromEn(code)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 }}>
                  <Copy size={12} color={t.primary} />
                  <Text style={{ fontSize: 11, color: t.primary, fontWeight: '600' }}>{tr('admin.notifications.copyFromEn')}</Text>
                </Pressable>
              )}
            </View>
            <TextInput
              value={vm.form[code].title}
              onChangeText={(v) => vm.setField(code, 'title', v)}
              placeholder={tr('admin.notifications.titlePlaceholder', { lang: code.toUpperCase() })}
              placeholderTextColor={t.fgFaint}
              maxLength={120}
              style={inputStyle}
            />
            <TextInput
              value={vm.form[code].body}
              onChangeText={(v) => vm.setField(code, 'body', v)}
              placeholder={tr('admin.notifications.bodyPlaceholder', { lang: code.toUpperCase() })}
              placeholderTextColor={t.fgFaint}
              multiline
              numberOfLines={3}
              maxLength={500}
              style={[inputStyle, { minHeight: 76, textAlignVertical: 'top' }]}
            />
          </View>
        ))}

        {vm.validationError && <Text style={{ fontSize: 12, color: t.fgMuted }}>{vm.validationError}</Text>}
        {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}

        {vm.lastDelivery && (
          <View style={{ padding: 14, borderRadius: 14, backgroundColor: t.successBg, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Check size={16} color={t.success} strokeWidth={2.5} />
              <Text style={{ color: t.success, fontWeight: '700' }}>{tr('admin.notifications.sent')}</Text>
            </View>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>
              {vm.lastDelivery.failureCount
                ? tr('admin.notifications.deliveredToWithFailures', {
                    success: vm.lastDelivery.successCount,
                    total: vm.lastDelivery.requestedTokens,
                    failed: vm.lastDelivery.failureCount,
                  })
                : tr('admin.notifications.deliveredTo', {
                    success: vm.lastDelivery.successCount,
                    total: vm.lastDelivery.requestedTokens,
                  })}
            </Text>
            {vm.lastDelivery.perLanguageCounts && (
              <Text style={{ fontSize: 11, color: t.fgFaint }}>
                {Object.entries(vm.lastDelivery.perLanguageCounts)
                  .map(([lang, n]) => `${lang.toUpperCase()}: ${n}`)
                  .join(' · ')}
              </Text>
            )}
          </View>
        )}

        <PrimaryButton label={vm.sending ? tr('auth.sending') : tr('admin.notifications.send')} onPress={vm.send} />
      </ScrollView>
    </SafeAreaView>
  );
}
