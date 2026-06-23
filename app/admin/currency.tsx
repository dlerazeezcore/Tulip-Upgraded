// THIN UI — wiring lives in src/screens/admin/useAdminCurrency.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { ChevronLeft, Check, Plus, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Toggle } from '@/components/Toggle';
import { Flag } from '@/components/Flag';
import { useAdminCurrency } from '@/screens/admin/useAdminCurrency';

export default function AdminCurrency() {
  const t = useTheme();
  const vm = useAdminCurrency();

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

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

  const sectionLabel = { fontSize: 11, fontWeight: '700' as const, color: t.fgMuted, textTransform: 'uppercase' as const, letterSpacing: 0.4 };
  const card = { padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 };

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
          Currencies & rates
        </Text>
      </View>

      {vm.loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={t.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 22, maxWidth: 620, width: '100%', alignSelf: 'center' }}>
          {/* ── Universal currency rates ── */}
          <View style={{ gap: 10 }}>
            <Text style={sectionLabel}>Display currencies (universal)</Text>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>
              The exchange rate is currency conversion only — it applies to every service. Enter the rate as
              IQD per 1 unit (e.g. 1 USD = 1,550 IQD). IQD is the settlement base (rate 1).
            </Text>
            <View style={{ ...card, padding: 0, overflow: 'hidden' }}>
              {vm.rows.length === 0 && (
                <Text style={{ padding: 16, fontSize: 13, color: t.fgMuted }}>No display currencies yet.</Text>
              )}
              {vm.rows.map((c, i) => (
                <View
                  key={c.code}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                    borderTopWidth: i === 0 ? 0 : 1, borderTopColor: t.border,
                    opacity: c.enabled ? 1 : 0.55,
                  }}
                >
                  <Flag iso={c.flag} size={30} />
                  <Pressable style={{ flex: 1 }} onPress={() => vm.openEdit(c)}>
                    <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>
                      {c.code} · {c.symbol}
                    </Text>
                    <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                      1 {c.code} = {c.rate.toLocaleString('en-US')} IQD
                    </Text>
                  </Pressable>
                  <Toggle value={c.enabled} onChange={() => vm.toggleEnabled(c)} />
                </View>
              ))}
            </View>
            <Pressable
              onPress={vm.openNew}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: t.border, borderStyle: 'dashed' }}
            >
              <Plus size={18} color={t.primary} />
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', color: t.primary }}>Add currency</Text>
            </Pressable>
          </View>

          {/* ── eSIM markup (service-scoped) ── */}
          <View style={{ gap: 10 }}>
            <Text style={sectionLabel}>eSIM markup</Text>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>
              Markup applied to the provider cost for eSIM only. Future per-country / per-package / per-class
              markups & discounts live in pricing rules — no code change needed.
            </Text>
            <View style={{ ...card, gap: 14 }}>
              <View style={{ gap: 6 }}>
                <Text style={sectionLabel}>Markup %</Text>
                <TextInput value={vm.markup} onChangeText={vm.onChangeMarkup} keyboardType="decimal-pad" placeholder="100" placeholderTextColor={t.fgFaint} style={numStyle} />
              </View>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: t.bgSunken }}>
                <Text style={{ fontSize: 12, color: t.fgMuted }}>Preview: a $1 eSIM plan sells for</Text>
                <Text style={{ fontFamily: t.font.display, fontWeight: '800', fontSize: 20, color: t.fg }}>
                  {vm.preview.toLocaleString('en-US')} IQD
                </Text>
                <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 2 }}>rounded to nearest 250 · charged in IQD</Text>
              </View>
              <PrimaryButton label={vm.busy ? 'Saving…' : 'Save markup'} onPress={vm.onSaveMarkup} />
            </View>
          </View>

          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          {vm.saved && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: 'rgba(22,163,74,0.12)' }}>
              <Check size={16} color={t.success} strokeWidth={2.5} />
              <Text style={{ color: t.success, fontWeight: '700' }}>Saved — prices updated</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Add / edit currency editor ── */}
      <Modal visible={!!vm.editing} transparent animationType="slide" onRequestClose={vm.closeEditor}>
        <Pressable onPress={vm.closeEditor} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, maxWidth: 620, width: '100%', alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                {vm.editing?.isNew ? 'Add currency' : `Edit ${vm.editing?.code}`}
              </Text>
              <Pressable onPress={vm.closeEditor}><X size={20} color={t.fgMuted} /></Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sectionLabel}>Code</Text>
                <TextInput
                  value={vm.editing?.code}
                  editable={vm.editing?.isNew}
                  autoCapitalize="characters"
                  onChangeText={(v) => vm.patchDraft({ code: v.toUpperCase().slice(0, 8) })}
                  placeholder="EUR" placeholderTextColor={t.fgFaint}
                  style={[numStyle, !vm.editing?.isNew && { opacity: 0.6 }]}
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sectionLabel}>Symbol</Text>
                <TextInput value={vm.editing?.symbol} onChangeText={(v) => vm.patchDraft({ symbol: v })} placeholder="€" placeholderTextColor={t.fgFaint} style={numStyle} />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={sectionLabel}>Name</Text>
              <TextInput value={vm.editing?.name} onChangeText={(v) => vm.patchDraft({ name: v })} placeholder="Euro" placeholderTextColor={t.fgFaint} style={numStyle} />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={sectionLabel}>Rate — IQD per 1 {vm.editing?.code || 'unit'}</Text>
              <TextInput value={vm.editing?.rate} onChangeText={(v) => vm.patchDraft({ rate: v.replace(/[^\d.]/g, '') })} keyboardType="decimal-pad" placeholder="1700" placeholderTextColor={t.fgFaint} style={numStyle} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sectionLabel}>Decimals</Text>
                <TextInput value={vm.editing?.decimals} onChangeText={(v) => vm.patchDraft({ decimals: v.replace(/[^\d]/g, '') })} keyboardType="number-pad" placeholder="2" placeholderTextColor={t.fgFaint} style={numStyle} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sectionLabel}>Flag (ISO-2)</Text>
                <TextInput value={vm.editing?.flag} onChangeText={(v) => vm.patchDraft({ flag: v.toUpperCase().slice(0, 2) })} autoCapitalize="characters" placeholder="EU" placeholderTextColor={t.fgFaint} style={numStyle} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>Symbol after amount</Text>
              <Toggle value={vm.editing?.position === 'suffix'} onChange={() => vm.patchDraft({ position: vm.editing?.position === 'suffix' ? 'prefix' : 'suffix' })} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>Enabled (visible to customers)</Text>
              <Toggle value={!!vm.editing?.enabled} onChange={() => vm.patchDraft({ enabled: !vm.editing?.enabled })} />
            </View>

            <PrimaryButton label={vm.busy ? 'Saving…' : 'Save currency'} onPress={vm.onSaveCurrency} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
