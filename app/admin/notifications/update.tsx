// THIN UI — wiring lives in src/screens/admin/notifications/useUpdateNotification.ts.
import React from 'react';
import { ScrollView, View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, Check } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useUpdateNotification } from '@/screens/admin/notifications/useUpdateNotification';

export default function AdminSendUpdateNotification() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useUpdateNotification();

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const current = vm.preview.find((p) => p.lang === vm.selectedLang) ?? vm.preview[0];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={vm.goBack} accessibilityRole="button" accessibilityLabel={tr('a11y.back')} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Bell size={20} color={t.primary} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            {tr('admin.notifications.update.title')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <Text style={{ fontSize: 12, color: t.fgMuted, lineHeight: 18 }}>
          {tr('admin.notifications.update.intro')}
        </Text>

        {/* Latest version — publishing this BLOCKS every older app build */}
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, gap: 8, ...t.shadow1 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>
            {tr('admin.notifications.update.latestVersionLabel')}
          </Text>
          <TextInput
            value={vm.latestVersion}
            onChangeText={vm.setLatestVersion}
            placeholder="1.0.0"
            placeholderTextColor={t.fgFaint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            style={{
              fontSize: 16,
              fontFamily: t.font.displayMedium,
              color: t.fg,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: t.bgSunken,
            }}
          />
          <Text style={{ fontSize: 11, color: t.warningFg, lineHeight: 16 }}>
            {tr('admin.notifications.update.latestVersionHint')}
          </Text>
        </View>

        {/* Language preview tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {vm.preview.map((p) => {
            const selected = p.lang === vm.selectedLang;
            return (
              <Pressable
                key={p.lang}
                onPress={() => vm.setSelectedLang(p.lang)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: selected ? t.primary : t.bgSunken,
                }}
              >
                <Text style={{ color: selected ? t.onPrimary : t.fg, fontWeight: '600', fontSize: 12 }}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Preview card */}
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, gap: 8, ...t.shadow1 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>
            {tr('admin.notifications.preview')}
          </Text>
          <Text style={{ fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>
            {current.title}
          </Text>
          <Text style={{ fontSize: 14, color: t.fgMuted, lineHeight: 20 }}>
            {current.body}
          </Text>
        </View>

        {/* Store URLs — editable; these open when a user taps "Update now" */}
        {vm.loadingVersion ? (
          <ActivityIndicator color={t.primary} />
        ) : (
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, gap: 10, ...t.shadow1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>
              {tr('admin.notifications.update.storeUrls')}
            </Text>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, color: t.fgMuted }}>{tr('admin.notifications.update.iosStoreUrl')}</Text>
              <TextInput
                value={vm.appStoreUrl}
                onChangeText={vm.setAppStoreUrl}
                placeholder="https://apps.apple.com/..."
                placeholderTextColor={t.fgFaint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={{ fontSize: 13, fontFamily: t.font.bodyMedium, color: t.fg, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: t.bgSunken }}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, color: t.fgMuted }}>{tr('admin.notifications.update.androidStoreUrl')}</Text>
              <TextInput
                value={vm.playStoreUrl}
                onChangeText={vm.setPlayStoreUrl}
                placeholder="https://play.google.com/..."
                placeholderTextColor={t.fgFaint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={{ fontSize: 13, fontFamily: t.font.bodyMedium, color: t.fg, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: t.bgSunken }}
              />
            </View>
            <Text style={{ fontSize: 11, color: t.fgMuted, lineHeight: 16 }}>
              {tr('admin.notifications.update.storeUrlsHint')}
            </Text>
          </View>
        )}

        {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}

        {vm.lastDelivery ? (
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
        ) : null}

        <PrimaryButton
          label={vm.sending ? tr('auth.sending') : tr('admin.notifications.update.publishAndSend')}
          onPress={vm.send}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
