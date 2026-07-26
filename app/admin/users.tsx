// THIN UI — wiring lives in src/screens/admin/useAdminUsers.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { Search, Star, X, Ban, ShieldCheck, Trash2, KeyRound } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { PasswordField } from '@/components/AuthShell';
import { CenteredModal } from '@/components/CenteredModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useAdminUsers } from '@/screens/admin/useAdminUsers';

export default function AdminUsers() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useAdminUsers();
  const {
    q, setQ, rows, users, loading, error,
    selected, setSelected, clearError, busy,
    onToggleLoyalty, onToggleBlock, onDelete,
    pwOpen, pwValue, pwNotice, setPwValue, togglePasswordForm, onSetPassword,
  } = vm;

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.back')}
          hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          {tr('admin.users.title')}{loading ? '' : ` · ${rows.length}`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12, maxWidth: 780, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: t.radius.md, backgroundColor: t.bgSunken }}>
          <Search size={18} color={t.fgMuted} />
          <TextInput value={q} onChangeText={setQ} placeholder={tr('admin.users.searchPlaceholder')} placeholderTextColor={t.fgFaint} style={{ flex: 1, fontSize: 14, color: t.fg, fontFamily: t.font.bodyMedium, paddingVertical: 2 }} />
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
        ) : error ? (
          <Text style={{ color: t.danger, textAlign: 'center', paddingVertical: 20 }}>{error}</Text>
        ) : (
          <View style={{ backgroundColor: t.bgElev, borderRadius: t.radius.md, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
            {users.map((u, i) => (
              <Pressable
                key={u.id}
                onPress={() => { clearError(); setSelected(u); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: i === users.length - 1 ? 0 : 1, borderBottomColor: t.border }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 14, color: t.fg }}>
                    {u.initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{u.name}</Text>
                    {u.isLoyalty && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: t.radius.pill, backgroundColor: t.infoBg }}>
                        <Star size={9} color={t.primary} fill={t.primary} />
                        <Text style={{ fontSize: 9, fontWeight: '800', color: t.primary }}>{tr('admin.users.loyaltyBadge')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{u.phone}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontSize: 11, color: u.isBlocked ? t.danger : u.status === 'active' ? t.success : t.fgMuted, fontWeight: '700' }}>
                    {u.isBlocked ? tr('admin.users.blockedBadge') : u.status}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: t.radius.pill,
                      backgroundColor:
                        u.versionKind === 'latest' ? t.successBg : u.versionKind === 'outdated' ? t.warningBg : t.bgSunken,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '800',
                        color:
                          u.versionKind === 'latest' ? t.successFg : u.versionKind === 'outdated' ? t.warningFg : t.fgFaint,
                      }}
                    >
                      {u.versionLabel}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
            {users.length === 0 && <Text style={{ color: t.fgMuted, textAlign: 'center', padding: 20 }}>{tr('admin.users.empty')}</Text>}
          </View>
        )}
      </ScrollView>

      {/* Edit modal (centered) */}
      <CenteredModal visible={selected !== null} onRequestClose={() => setSelected(null)} maxWidth={480}>
            {selected && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{selected.name}</Text>
                    <Text style={{ fontSize: 12, color: t.fgMuted }}>{selected.phone}{selected.email ? ` · ${selected.email}` : ''}</Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel={tr('a11y.close')}><X size={20} color={t.fgMuted} /></Pressable>
                </View>

                {/* App build this user is on (fills in as they use a header-sending build). */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 }}>
                  <Text style={{ flex: 1, fontSize: 13, color: t.fgMuted }}>{tr('admin.users.appVersion')}</Text>
                  <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: t.radius.pill, backgroundColor: selected.versionKind === 'latest' ? t.successBg : selected.versionKind === 'outdated' ? t.warningBg : t.bgSunken }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: selected.versionKind === 'latest' ? t.successFg : selected.versionKind === 'outdated' ? t.warningFg : t.fgFaint }}>
                      {selected.appVersion ? `v${selected.appVersion}` : '—'}{selected.versionKind === 'latest' ? ` · ${tr('admin.users.onLatest')}` : ''}
                    </Text>
                  </View>
                </View>

                {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}

                <Pressable
                  onPress={() => onToggleLoyalty(selected)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: t.radius.md, backgroundColor: t.bgSunken }}
                >
                  <Star size={18} color={t.primary} fill={selected.isLoyalty ? t.primary : 'transparent'} />
                  <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
                    {selected.isLoyalty ? tr('admin.users.revokeLoyalty') : tr('admin.users.grantLoyalty')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => onToggleBlock(selected)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: t.radius.md, backgroundColor: t.bgSunken }}
                >
                  {selected.isBlocked ? <ShieldCheck size={18} color={t.success} /> : <Ban size={18} color={t.warning} />}
                  <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
                    {selected.isBlocked ? tr('admin.users.unblockUser') : tr('admin.users.blockUser')}
                  </Text>
                </Pressable>

                {/* Set OR reset the password. A WhatsApp-only signup has none yet
                    (hasPassword === false), so the label reflects which it is. */}
                <Pressable
                  onPress={togglePasswordForm}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: t.radius.md, backgroundColor: t.bgSunken }}
                >
                  <KeyRound size={18} color={t.primary} />
                  <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
                    {selected.hasPassword ? tr('admin.users.resetPassword') : tr('admin.users.setPassword')}
                  </Text>
                </Pressable>

                {pwOpen && (
                  <View style={{ gap: 10, padding: 14, borderRadius: t.radius.md, backgroundColor: t.bgSunken }}>
                    <PasswordField
                      label={tr('admin.users.newPasswordLabel')}
                      value={pwValue}
                      onChangeText={setPwValue}
                      placeholder={tr('auth.newPasswordPlaceholder')}
                    />
                    <Text style={{ fontSize: 11, color: t.fgMuted }}>{tr('admin.users.passwordHint')}</Text>
                    {/* Bearer tokens have no revocation list, so an existing session
                        survives a password change — say so instead of implying it. */}
                    <Text style={{ fontSize: 11, color: t.fgMuted }}>{tr('admin.users.sessionsNotRevokedHint')}</Text>
                    <PrimaryButton
                      label={tr('admin.users.savePassword')}
                      onPress={() => onSetPassword(selected)}
                      loading={busy}
                    />
                  </View>
                )}

                {pwNotice && <Text style={{ fontSize: 12, color: t.success }}>{pwNotice}</Text>}

                <Pressable
                  onPress={() => onDelete(selected)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: t.radius.md, backgroundColor: t.dangerBg }}
                >
                  <Trash2 size={18} color={t.danger} />
                  <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.danger }}>
                    {busy ? tr('admin.users.working') : tr('admin.users.deleteUser')}
                  </Text>
                </Pressable>
              </>
            )}
      </CenteredModal>
    </ScreenSafeArea>
  );
}
