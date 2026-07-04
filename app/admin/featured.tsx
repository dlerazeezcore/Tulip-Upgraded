// THIN UI — wiring lives in src/screens/admin/useAdminFeatured.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, X, Eye, EyeOff } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PrimaryButton } from '@/components/PrimaryButton';
import { CenteredModal } from '@/components/CenteredModal';
import { useAdminFeatured } from '@/screens/admin/useAdminFeatured';

export default function AdminFeatured() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useAdminFeatured();

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const numStyle = {
    backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: t.fg, fontFamily: t.font.bodyMedium,
  } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={vm.goBack} accessibilityRole="button" accessibilityLabel={tr('a11y.back')} hitSlop={4} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>{tr('admin.featured.title')}</Text>
        <Pressable onPress={() => vm.setAdding(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: t.primary }}>
          <Plus size={14} color={t.onPrimary} strokeWidth={2.6} />
          <Text style={{ color: t.onPrimary, fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>{tr('admin.featured.add')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10, maxWidth: 780, width: '100%', alignSelf: 'center' }}>
        {vm.loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
        ) : (
          <View style={{ backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
            {vm.rows.map((r, i) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: i === vm.rows.length - 1 ? 0 : 1, borderBottomColor: t.border, opacity: (r.enabled ?? true) ? 1 : 0.5 }}>
                <Flag iso={r.code} size={28} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{r.name}</Text>
                  <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{tr('admin.featured.codeOrder', { code: r.code, order: r.sort_order ?? 0 })}</Text>
                </View>
                <Pressable onPress={() => vm.toggleEnabled(r)} accessibilityRole="button" accessibilityLabel={(r.enabled ?? true) ? tr('admin.featured.hideFromFeatured') : tr('admin.featured.showInFeatured')} accessibilityState={{ selected: (r.enabled ?? true) }} hitSlop={4} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                  {(r.enabled ?? true) ? <Eye size={15} color={t.fg} /> : <EyeOff size={15} color={t.fgMuted} />}
                </Pressable>
                <Pressable onPress={() => vm.onDelete(r)} accessibilityRole="button" accessibilityLabel={tr('a11y.delete')} hitSlop={4} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.dangerBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={15} color={t.danger} />
                </Pressable>
              </View>
            ))}
            {vm.rows.length === 0 && <Text style={{ color: t.fgMuted, textAlign: 'center', padding: 20 }}>{tr('admin.featured.empty')}</Text>}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!vm.confirmRow} transparent animationType="fade" onRequestClose={() => vm.setConfirmRow(null)}>
        <Pressable onPress={() => vm.setConfirmRow(null)} style={{ flex: 1, backgroundColor: t.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Pressable style={{ backgroundColor: t.bgElev, borderRadius: 20, padding: 22, gap: 8, maxWidth: 380, width: '100%' }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('admin.featured.removeTitle')}</Text>
            <Text style={{ fontSize: 13, color: t.fgMuted }}>
              {tr('admin.featured.removeBody', { name: vm.confirmRow?.name })}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Pressable onPress={() => vm.setConfirmRow(null)} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: t.border, alignItems: 'center' }}>
                <Text style={{ color: t.fg, fontWeight: '700', fontSize: 14 }}>{tr('common.cancel')}</Text>
              </Pressable>
              <Pressable onPress={vm.confirmDelete} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: t.danger, alignItems: 'center' }}>
                <Text style={{ color: t.onPrimary, fontWeight: '700', fontSize: 14 }}>{tr('admin.featured.remove')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <CenteredModal visible={vm.adding} onRequestClose={() => vm.setAdding(false)} maxWidth={520} dismissOnBackdrop={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('admin.featured.addTitle')}</Text>
              <Pressable onPress={() => vm.setAdding(false)} accessibilityRole="button" accessibilityLabel={tr('a11y.close')}><X size={20} color={t.fgMuted} /></Pressable>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>{tr('admin.featured.countryCode')}</Text>
              <TextInput value={vm.code} onChangeText={vm.onChangeCode} placeholder="US" placeholderTextColor={t.fgFaint} autoCapitalize="characters" style={numStyle} />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>{tr('admin.featured.displayName')}</Text>
              <TextInput value={vm.name} onChangeText={vm.setName} placeholder={tr('admin.featured.countryPlaceholder')} placeholderTextColor={t.fgFaint} style={numStyle} />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>{tr('admin.featured.sortOrder')}</Text>
              <TextInput value={vm.sortOrder} onChangeText={vm.onChangeSortOrder} keyboardType="number-pad" placeholder="0" placeholderTextColor={t.fgFaint} style={numStyle} />
            </View>
            <PrimaryButton label={vm.busy ? tr('admin.featured.saving') : tr('admin.featured.addTitle')} onPress={vm.onAdd} style={{ marginTop: 4 }} />
      </CenteredModal>
    </SafeAreaView>
  );
}
