// THIN UI — wiring lives in src/screens/admin/notifications/useUpdateNotification.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { ChevronLeft, Bell, Check } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useUpdateNotification } from '@/screens/admin/notifications/useUpdateNotification';

export default function AdminSendUpdateNotification() {
  const t = useTheme();
  const vm = useUpdateNotification();

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const current = vm.preview.find((p) => p.lang === vm.selectedLang) ?? vm.preview[0];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={vm.goBack} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Bell size={20} color={t.primary} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            Send update notification
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <Text style={{ fontSize: 12, color: t.fgMuted, lineHeight: 18 }}>
          One tap sends the pre-baked "new version available" notification to every active device.
          Each device receives the message in its own language (English, Arabic, or Kurdish).
        </Text>

        {/* Language preview tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {vm.preview.map((p) => {
            const selected = p.lang === vm.selectedLang;
            return (
              <Pressable
                key={p.lang}
                onPress={() => vm.setSelectedLang(p.lang)}
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
            Preview
          </Text>
          <Text style={{ fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>
            {current.title}
          </Text>
          <Text style={{ fontSize: 14, color: t.fgMuted, lineHeight: 20 }}>
            {current.body}
          </Text>
        </View>

        {/* Store URLs from version-info */}
        {vm.loadingVersion ? (
          <ActivityIndicator color={t.primary} />
        ) : (
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: t.bgSunken, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>
              Store URLs (from app/version-info)
            </Text>
            <Text style={{ fontSize: 11, color: t.fgMuted }}>iOS: {vm.versionInfo?.appStoreUrl || '(not set)'}</Text>
            <Text style={{ fontSize: 11, color: t.fgMuted }}>Android: {vm.versionInfo?.playStoreUrl || '(not set)'}</Text>
          </View>
        )}

        {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}

        {vm.lastDelivery ? (
          <View style={{ padding: 14, borderRadius: 14, backgroundColor: 'rgba(22,163,74,0.12)', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Check size={16} color={t.success} strokeWidth={2.5} />
              <Text style={{ color: t.success, fontWeight: '700' }}>Sent</Text>
            </View>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>
              Delivered to {vm.lastDelivery.successCount} of {vm.lastDelivery.requestedTokens} devices
              {vm.lastDelivery.failureCount ? ` (${vm.lastDelivery.failureCount} failed)` : ''}.
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
          label={vm.sending ? 'Sending…' : 'Send to all users'}
          onPress={vm.send}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
