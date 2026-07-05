// THIN UI — wiring lives in src/screens/admin/usePricing.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, Plus, X, Trash2 } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { CenteredModal } from '@/components/CenteredModal';
import { usePricing } from '@/screens/admin/usePricing';
import type { RuleScope, AdjustmentType } from '@/services/admin';

function Seg<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.bgSunken, borderRadius: 10, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable key={o.id} onPress={() => onChange(o.id)} style={{ flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', backgroundColor: on ? t.bgElev : 'transparent', ...(on ? t.shadow1 : {}) }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: on ? t.fg : t.fgMuted, fontFamily: t.font.displayMedium }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AdminPricing() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = usePricing();

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const numStyle = { backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: t.fg, fontFamily: t.font.bodyMedium } as const;
  const sectionLabel = { fontSize: 11, fontWeight: '700' as const, color: t.fgMuted, textTransform: 'uppercase' as const, letterSpacing: 0.4 };
  const card = { borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, overflow: 'hidden' as const, ...t.shadow1 };

  const fmtVal = (type: AdjustmentType, value: number) =>
    type === 'percent'
      ? tr('admin.pricing.valuePercent', { value })
      : type === 'absolute'
        ? tr('admin.pricing.valueExact', { value: value.toLocaleString('en-US') })
        : tr('admin.pricing.valueFixed', { value: value.toLocaleString('en-US') });

  const scopeTarget = (scope: RuleScope, country: string | null, pkg: string | null) =>
    scope === 'global' ? tr('admin.pricing.scopeGeneral') : scope === 'country' ? vm.countryName(country) : pkg || '';

  const addBtn = (label: string, onPress: () => void) => (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: t.border, borderStyle: 'dashed' }}>
      <Plus size={18} color={t.primary} />
      <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', color: t.primary }}>{label}</Text>
    </Pressable>
  );

  const ruleRow = (key: string, scope: RuleScope, target: string, valueLabel: string, onEdit: () => void, onRemove: () => void, last: boolean) => (
    <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.border }}>
      <Pressable style={{ flex: 1 }} onPress={onEdit}>
        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{target}</Text>
        <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
          {tr(scope === 'global' ? 'admin.pricing.scopeGeneralTag' : scope === 'country' ? 'admin.pricing.scopeCountryTag' : 'admin.pricing.scopeBundleTag')} · {valueLabel}
        </Text>
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={tr('admin.pricing.remove')} style={{ padding: 6 }}>
        <Trash2 size={18} color={t.danger} />
      </Pressable>
    </View>
  );

  const ed = vm.editing;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={vm.goBack} accessibilityRole="button" accessibilityLabel={tr('a11y.back')} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>{tr('admin.pricing.title')}</Text>
      </View>

      {vm.loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 22, maxWidth: 620, width: '100%', alignSelf: 'center' }}>
          <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('admin.pricing.intro', { percent: vm.generalMarkup })}</Text>

          {/* ── Markup overrides ── */}
          <View style={{ gap: 10 }}>
            <Text style={sectionLabel}>{tr('admin.pricing.markupOverrides')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: t.bgSunken }}>
              <Text style={{ flex: 1, fontSize: 13, color: t.fg, fontWeight: '600' }}>{tr('admin.pricing.generalMarkup')}</Text>
              <Text style={{ fontSize: 13, color: t.fgMuted }}>{tr('admin.pricing.generalValue', { percent: vm.generalMarkup })}</Text>
            </View>
            {vm.markupOverrides.length > 0 && (
              <View style={card}>
                {vm.markupOverrides.map((r, i) =>
                  ruleRow(
                    `m${r.id}`,
                    r.rule_scope,
                    r.rule_scope === 'package' ? r.custom_fields?.label || r.package_code || '' : scopeTarget(r.rule_scope, r.country_code, r.package_code),
                    fmtVal(r.adjustment_type, r.adjustment_value),
                    () => vm.openEditMarkup(r),
                    () => vm.onRemoveMarkup(r),
                    i === vm.markupOverrides.length - 1,
                  ),
                )}
              </View>
            )}
            {addBtn(tr('admin.pricing.addOverride'), vm.openAddMarkup)}
          </View>

          {/* ── Discounts ── */}
          <View style={{ gap: 10 }}>
            <Text style={sectionLabel}>{tr('admin.pricing.discounts')}</Text>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('admin.pricing.discountsHint')}</Text>
            {vm.discounts.length > 0 && (
              <View style={card}>
                {vm.discounts.map((r, i) =>
                  ruleRow(
                    `d${r.id}`,
                    r.rule_scope,
                    r.rule_scope === 'package' ? r.custom_fields?.label || r.package_code || '' : scopeTarget(r.rule_scope, r.country_code, r.package_code),
                    fmtVal(r.discount_type, r.discount_value),
                    () => vm.openEditDiscount(r),
                    () => vm.onRemoveDiscount(r),
                    i === vm.discounts.length - 1,
                  ),
                )}
              </View>
            )}
            {addBtn(tr('admin.pricing.addDiscount'), vm.openAddDiscount)}
          </View>

          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          {vm.saved && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: t.successBg }}>
              <Check size={16} color={t.success} strokeWidth={2.5} />
              <Text style={{ color: t.success, fontWeight: '700' }}>{tr('admin.currency.savedPricesUpdated')}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Add / edit rule editor (centered dialog) ── */}
      <CenteredModal visible={!!ed} onRequestClose={vm.closeEditor} maxWidth={620} dismissOnBackdrop={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                {tr(ed?.kind === 'discount' ? (ed?.isNew ? 'admin.pricing.addDiscount' : 'admin.pricing.editDiscount') : ed?.isNew ? 'admin.pricing.addOverride' : 'admin.pricing.editOverride')}
              </Text>
              <Pressable onPress={vm.closeEditor} accessibilityRole="button" accessibilityLabel={tr('a11y.close')}><X size={20} color={t.fgMuted} /></Pressable>
            </View>

            {ed?.isNew && (
              <View style={{ gap: 6 }}>
                <Text style={sectionLabel}>{tr('admin.pricing.appliesTo')}</Text>
                <Seg<RuleScope>
                  value={ed.scope}
                  onChange={(scope) => vm.patchDraft({ scope })}
                  options={[
                    ...(ed.kind === 'discount' ? [{ id: 'global' as RuleScope, label: tr('admin.pricing.scopeGeneral') }] : []),
                    { id: 'country', label: tr('admin.pricing.scopeCountry') },
                    { id: 'package', label: tr('admin.pricing.scopeBundle') },
                  ]}
                />
              </View>
            )}

            {ed?.scope === 'country' && (
              <View style={{ gap: 6 }}>
                <Text style={sectionLabel}>{tr('admin.pricing.countryCode')}</Text>
                <TextInput value={ed.countryCode} editable={ed.isNew} autoCapitalize="characters" onChangeText={(v) => vm.patchDraft({ countryCode: v.toUpperCase().slice(0, 2) })} placeholder="TR" placeholderTextColor={t.fgFaint} style={[numStyle, !ed.isNew && { opacity: 0.6 }]} />
                {!!vm.countryName(ed.countryCode) && ed.countryCode.length === 2 && (
                  <Text style={{ fontSize: 12, color: t.fgMuted }}>{vm.countryName(ed.countryCode)}</Text>
                )}
              </View>
            )}

            {ed?.scope === 'package' &&
              (ed.isNew ? (
                <View style={{ gap: 8 }}>
                  <Text style={sectionLabel}>{tr('admin.pricing.pickCountry')}</Text>
                  <TextInput value={vm.bundleCountry} autoCapitalize="characters" onChangeText={vm.loadBundles} placeholder="TR" placeholderTextColor={t.fgFaint} style={numStyle} />
                  {vm.bundlesLoading ? (
                    <ActivityIndicator color={t.primary} style={{ marginVertical: 8 }} />
                  ) : vm.bundles.length > 0 ? (
                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                      {vm.bundles.map((b) => {
                        const on = b.packageCode === ed.packageCode;
                        return (
                          <Pressable key={b.packageCode} onPress={() => vm.pickBundle(b)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, backgroundColor: on ? t.bgSunken : 'transparent' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: t.fg }}>{b.label}</Text>
                              {!!b.slug && <Text style={{ fontSize: 11, color: t.fgMuted, marginTop: 1 }}>{b.slug} · {b.packageCode}</Text>}
                            </View>
                            {on && <Check size={16} color={t.primary} strokeWidth={2.5} />}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  ) : vm.bundleCountry.length === 2 ? (
                    <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('admin.pricing.noBundles', { code: vm.bundleCountry })}</Text>
                  ) : null}
                  {!!ed.packageCode && <Text style={{ fontSize: 12, color: t.primary, fontWeight: '700' }}>{tr('admin.pricing.selected', { label: ed.packageLabel })}</Text>}
                </View>
              ) : (
                <View style={{ gap: 6 }}>
                  <Text style={sectionLabel}>{tr('admin.pricing.bundleCode')}</Text>
                  <Text style={{ fontSize: 15, color: t.fg, fontWeight: '600' }}>{ed.packageLabel || ed.packageCode}</Text>
                </View>
              ))}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sectionLabel}>{tr('admin.pricing.type')}</Text>
                <Seg<AdjustmentType>
                  value={ed?.type ?? 'percent'}
                  onChange={(type) => vm.patchDraft({ type })}
                  options={[
                    { id: 'percent', label: tr('admin.pricing.percent') },
                    { id: 'fixed', label: tr('admin.pricing.fixed') },
                    // 'absolute' (exact price) is a markup concept only — never for discounts.
                    ...(ed?.kind === 'discount' ? [] : [{ id: 'absolute' as AdjustmentType, label: tr('admin.pricing.absolute') }]),
                  ]}
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sectionLabel}>{tr('admin.pricing.value')}</Text>
                <TextInput value={ed?.value} onChangeText={(v) => vm.patchDraft({ value: v.replace(/[^\d.]/g, '') })} keyboardType="decimal-pad" placeholder={ed?.type === 'absolute' ? '5000' : ed?.type === 'fixed' ? '1000' : '80'} placeholderTextColor={t.fgFaint} style={numStyle} />
              </View>
            </View>

            {/* Plain-language explainer so the three types aren't confused
                (fixed ADDS to cost; absolute SETS the exact final price). */}
            {ed?.kind !== 'discount' && (
              <Text style={{ fontSize: 12, color: t.fgMuted }}>
                {tr(ed?.type === 'absolute' ? 'admin.pricing.typeHintAbsolute' : ed?.type === 'fixed' ? 'admin.pricing.typeHintFixed' : 'admin.pricing.typeHintPercent')}
              </Text>
            )}
            {ed?.type === 'absolute' && !!ed?.value && Number.isFinite(parseFloat(ed.value)) && (
              <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>
                {tr('admin.pricing.exactPreview', { value: parseFloat(ed.value).toLocaleString('en-US') })}
              </Text>
            )}

            <PrimaryButton label={vm.busy ? tr('admin.currency.saving') : tr('admin.pricing.saveRule')} onPress={vm.onSave} />
      </CenteredModal>
    </SafeAreaView>
  );
}
