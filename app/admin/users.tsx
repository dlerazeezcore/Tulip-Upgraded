// THIN UI — wiring lives in src/screens/admin/useAdminUsers.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { ChevronLeft, Search, Star, X, Ban, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useAdminUsers } from '@/screens/admin/useAdminUsers';

export default function AdminUsers() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useAdminUsers();
  const {
    q, setQ, rows, users, loading, error,
    selected, setSelected, clearError, busy,
    onToggleLoyalty, onToggleBlock, onDelete,
  } = vm;

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
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          {tr('admin.users.title')}{loading ? '' : ` · ${rows.length}`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12, maxWidth: 780, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: t.bgSunken }}>
          <Search size={18} color={t.fgMuted} />
          <TextInput value={q} onChangeText={setQ} placeholder={tr('admin.users.searchPlaceholder')} placeholderTextColor={t.fgFaint} style={{ flex: 1, fontSize: 14, color: t.fg, fontFamily: t.font.bodyMedium, paddingVertical: 2 }} />
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
        ) : error ? (
          <Text style={{ color: t.danger, textAlign: 'center', paddingVertical: 20 }}>{error}</Text>
        ) : (
          <View style={{ backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
            {users.map((u, i) => (
              <Pressable
                key={u.id}
                onPress={() => { clearError(); setSelected(u); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: i === users.length - 1 ? 0 : 1, borderBottomColor: t.border }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 14, color: t.fg }}>
                    {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{u.name}</Text>
                    {u.isLoyalty && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(25,103,210,0.12)' }}>
                        <Star size={9} color={t.primary} fill={t.primary} />
                        <Text style={{ fontSize: 9, fontWeight: '800', color: t.primary }}>{tr('admin.users.loyaltyBadge')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{u.phone}</Text>
                </View>
                <Text style={{ fontSize: 11, color: u.isBlocked ? t.danger : u.status === 'active' ? t.success : t.fgMuted, fontWeight: '700' }}>
                  {u.isBlocked ? tr('admin.users.blockedBadge') : u.status}
                </Text>
              </Pressable>
            ))}
            {users.length === 0 && <Text style={{ color: t.fgMuted, textAlign: 'center', padding: 20 }}>{tr('admin.users.empty')}</Text>}
          </View>
        )}
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={selected !== null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable onPress={() => setSelected(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            {selected && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{selected.name}</Text>
                    <Text style={{ fontSize: 12, color: t.fgMuted }}>{selected.phone}{selected.email ? ` · ${selected.email}` : ''}</Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)}><X size={20} color={t.fgMuted} /></Pressable>
                </View>

                {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}

                <Pressable
                  onPress={() => onToggleLoyalty(selected)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: t.bgSunken }}
                >
                  <Star size={18} color={t.primary} fill={selected.isLoyalty ? t.primary : 'transparent'} />
                  <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
                    {selected.isLoyalty ? tr('admin.users.revokeLoyalty') : tr('admin.users.grantLoyalty')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => onToggleBlock(selected)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: t.bgSunken }}
                >
                  {selected.isBlocked ? <ShieldCheck size={18} color={t.success} /> : <Ban size={18} color={t.warning} />}
                  <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
                    {selected.isBlocked ? tr('admin.users.unblockUser') : tr('admin.users.blockUser')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => onDelete(selected)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: 'rgba(220,38,38,0.1)' }}
                >
                  <Trash2 size={18} color={t.danger} />
                  <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.danger }}>
                    {busy ? tr('admin.users.working') : tr('admin.users.deleteUser')}
                  </Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
