// THIN UI — wiring lives in src/screens/admin/useAdminCurrency.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, Plus, X } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { CenteredModal } from '@/components/CenteredModal';
import { Toggle } from '@/components/Toggle';
import { Flag } from '@/components/Flag';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useAdminCurrency } from '@/screens/admin/useAdminCurrency';

export default function AdminCurrency() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useAdminCurrency();

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const numStyle = {
    backgroundColor: t.bgElev,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: t.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: t.fg,
    fontFamily: t.font.bodyMedium,
  } as const;

  const sectionLabel = { fontSize: 11, fontWeight: '700' as const, color: t.fgMuted, textTransform: 'uppercase' as const, letterSpacing: 0.4 };
  const card = { padding: 16, borderRadius: t.radius.card, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 };

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
          {tr('admin.currency.title')}
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
            <Text style={sectionLabel}>{tr('admin.currency.displayCurrencies')}</Text>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>
              {tr('admin.currency.displayCurrenciesHint')}
            </Text>
            <View style={{ ...card, padding: 0, overflow: 'hidden' }}>
              {vm.rows.length === 0 && (
                <Text style={{ padding: 16, fontSize: 13, color: t.fgMuted }}>{tr('admin.currency.noCurrencies')}</Text>
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
                      {tr('admin.currency.rateLine', { code: c.code, rate: c.rate.toLocaleString('en-US') })}
                    </Text>
                  </Pressable>
                  <Toggle value={c.enabled} onChange={() => vm.toggleEnabled(c)} />
                </View>
              ))}
            </View>
            <Pressable
              onPress={vm.openNew}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: t.radius.md, borderWidth: 1.5, borderColor: t.border, borderStyle: 'dashed' }}
            >
              <Plus size={18} color={t.primary} />
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', color: t.primary }}>{tr('admin.currency.addCurrency')}</Text>
            </Pressable>
          </View>

          {/* ── eSIM markup (service-scoped) ── */}
          <View style={{ gap: 10 }}>
            <Text style={sectionLabel}>{tr('admin.currency.esimMarkup')}</Text>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>
              {tr('admin.currency.esimMarkupHint')}
            </Text>
            <View style={{ ...card, gap: 14 }}>
              <View style={{ gap: 6 }}>
                <Text style={sectionLabel}>{tr('admin.currency.markupPercent')}</Text>
                <TextInput value={vm.markup} onChangeText={vm.onChangeMarkup} keyboardType="decimal-pad" placeholder="100" placeholderTextColor={t.fgFaint} style={numStyle} />
              </View>
              <View style={{ padding: 12, borderRadius: t.radius.md, backgroundColor: t.bgSunken }}>
                <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('admin.currency.previewLabel')}</Text>
                <Text style={{ fontFamily: t.font.display, fontWeight: '800', fontSize: 20, color: t.fg }}>
                  {tr('admin.currency.previewValue', { amount: vm.preview.toLocaleString('en-US') })}
                </Text>
                <Text style={{ fontSize: 11, color: t.fgFaint, marginTop: 2 }}>{tr('admin.currency.previewNote')}</Text>
              </View>
              <PrimaryButton label={vm.busy ? tr('admin.currency.saving') : tr('admin.currency.saveMarkup')} onPress={vm.onSaveMarkup} />
            </View>
          </View>

          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          {vm.saved && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: t.radius.md, backgroundColor: t.successBg }}>
              <Check size={16} color={t.success} strokeWidth={2.5} />
              <Text style={{ color: t.success, fontWeight: '700' }}>{tr('admin.currency.savedPricesUpdated')}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Add / edit currency editor (centered) ── */}
      <CenteredModal visible={!!vm.editing} onRequestClose={vm.closeEditor} maxWidth={620} dismissOnBackdrop={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                {vm.editing?.isNew ? tr('admin.currency.addCurrency') : tr('admin.currency.editCurrency', { code: vm.editing?.code })}
              </Text>
              <Pressable onPress={vm.closeEditor} accessibilityRole="button" accessibilityLabel={tr('a11y.close')}><X size={20} color={t.fgMuted} /></Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sectionLabel}>{tr('admin.currency.code')}</Text>
                <TextInput
                  value={vm.editing?.code}
                  editable={vm.editing?.isNew}
                  autoCapitalize="characters"
                  onChangeText={(v) => vm.patchDraft({ code: v.toUpperCase().slice(0, 8) })}
                  placeholder={tr('admin.currency.codePlaceholder')} placeholderTextColor={t.fgFaint}
                  style={[numStyle, !vm.editing?.isNew && { opacity: 0.6 }]}
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sectionLabel}>{tr('admin.currency.symbol')}</Text>
                <TextInput value={vm.editing?.symbol} onChangeText={(v) => vm.patchDraft({ symbol: v })} placeholder="€" placeholderTextColor={t.fgFaint} style={numStyle} />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={sectionLabel}>{tr('admin.currency.name')}</Text>
              <TextInput value={vm.editing?.name} onChangeText={(v) => vm.patchDraft({ name: v })} placeholder={tr('admin.currency.namePlaceholder')} placeholderTextColor={t.fgFaint} style={numStyle} />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={sectionLabel}>{tr('admin.currency.rateField', { code: vm.editing?.code || tr('admin.currency.unit') })}</Text>
              <TextInput value={vm.editing?.rate} onChangeText={(v) => vm.patchDraft({ rate: v.replace(/[^\d.]/g, '') })} keyboardType="decimal-pad" placeholder="1700" placeholderTextColor={t.fgFaint} style={numStyle} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sectionLabel}>{tr('admin.currency.decimals')}</Text>
                <TextInput value={vm.editing?.decimals} onChangeText={(v) => vm.patchDraft({ decimals: v.replace(/[^\d]/g, '') })} keyboardType="number-pad" placeholder="2" placeholderTextColor={t.fgFaint} style={numStyle} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sectionLabel}>{tr('admin.currency.flag')}</Text>
                <TextInput value={vm.editing?.flag} onChangeText={(v) => vm.patchDraft({ flag: v.toUpperCase().slice(0, 2) })} autoCapitalize="characters" placeholder="EU" placeholderTextColor={t.fgFaint} style={numStyle} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{tr('admin.currency.symbolAfterAmount')}</Text>
              <Toggle value={vm.editing?.position === 'suffix'} onChange={() => vm.patchDraft({ position: vm.editing?.position === 'suffix' ? 'prefix' : 'suffix' })} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{tr('admin.currency.enabledVisible')}</Text>
              <Toggle value={!!vm.editing?.enabled} onChange={() => vm.patchDraft({ enabled: !vm.editing?.enabled })} />
            </View>

            <PrimaryButton label={vm.busy ? tr('admin.currency.saving') : tr('admin.currency.saveCurrency')} onPress={vm.onSaveCurrency} />
      </CenteredModal>
    </ScreenSafeArea>
  );
}
