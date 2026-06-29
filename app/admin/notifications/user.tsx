// THIN UI — wiring lives in src/screens/admin/notifications/useSendToUser.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { User, X, Check, Copy } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useSendToUser } from '@/screens/admin/notifications/useSendToUser';

export default function AdminSendToUser() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useSendToUser();

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
        <Pressable onPress={vm.goBack} accessibilityRole="button" accessibilityLabel={tr('a11y.back')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <User size={20} color={t.primary} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            {tr('admin.notifications.user.title')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        {/* User picker */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>{tr('admin.notifications.user.recipient')}</Text>
          {vm.selectedUser ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: t.bgElev,
              borderColor: t.primary,
              borderWidth: 1.5,
            }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: `${t.primary}1A`, alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} color={t.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: t.fg }}>{vm.selectedUser.name}</Text>
                <Text style={{ fontSize: 12, color: t.fgMuted }}>{vm.selectedUser.phone}</Text>
              </View>
              <Pressable onPress={() => vm.selectUser(null)} accessibilityRole="button" accessibilityLabel={tr('a11y.removeSelectedUser')} style={{ padding: 8 }}>
                <X size={18} color={t.fgMuted} />
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                value={vm.search}
                onChangeText={vm.setSearch}
                placeholder={tr('admin.notifications.user.searchPlaceholder')}
                placeholderTextColor={t.fgFaint}
                style={inputStyle}
              />
              <View style={{ borderRadius: 12, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, maxHeight: 240 }}>
                {vm.loadingUsers ? (
                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <ActivityIndicator color={t.primary} />
                  </View>
                ) : vm.users.length === 0 ? (
                  <Text style={{ padding: 16, fontSize: 12, color: t.fgMuted }}>{tr('admin.notifications.user.noUsers')}</Text>
                ) : (
                  <ScrollView>
                    {vm.users.map((u) => (
                      <Pressable
                        key={u.id}
                        onPress={() => vm.selectUser(u)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: t.border,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '600', color: t.fg }}>{u.name}</Text>
                          <Text style={{ fontSize: 12, color: t.fgMuted }}>{u.phone}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            </>
          )}
        </View>

        {/* 3-language form */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>
          {tr('admin.notifications.messageLangs')}
        </Text>
        <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: -8 }}>
          {tr('admin.notifications.user.langHint')}
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
          <View style={{ padding: 14, borderRadius: 14, backgroundColor: 'rgba(22,163,74,0.12)', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Check size={16} color={t.success} strokeWidth={2.5} />
              <Text style={{ color: t.success, fontWeight: '700' }}>{tr('admin.notifications.sent')}</Text>
            </View>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>
              {tr('admin.notifications.deliveredTo', { success: vm.lastDelivery.successCount, total: vm.lastDelivery.requestedTokens })}
            </Text>
          </View>
        )}

        <PrimaryButton
          label={vm.sending ? tr('auth.sending') : tr('admin.notifications.send')}
          onPress={vm.send}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
