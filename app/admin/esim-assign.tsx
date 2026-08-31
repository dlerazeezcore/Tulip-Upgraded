// THIN UI — wiring lives in src/screens/admin/useEsimAssign.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Gift, User, X, Check, MapPin } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PressableScale } from '@/components/PressableScale';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useEsimAssign, type AssignTab } from '@/screens/admin/useEsimAssign';

export default function AdminEsimAssign() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useEsimAssign();

  if (!vm.isAdmin) return <Redirect href="/(tabs)/profile" />;

  const inputStyle = {
    backgroundColor: t.bgElev,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: t.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: t.fg,
    fontFamily: t.font.body,
  } as const;

  const sectionLabel = {
    fontSize: 11,
    fontWeight: '700',
    color: t.fgMuted,
    textTransform: 'uppercase',
  } as const;

  const card = {
    borderRadius: t.radius.md,
    backgroundColor: t.bgElev,
    borderColor: t.border,
    borderWidth: 1,
  } as const;

  const tabs: { id: AssignTab; label: string }[] = [
    { id: 'popular', label: tr('admin.esimAssign.tabPopular') },
    { id: 'countries', label: tr('admin.esimAssign.tabCountries') },
    { id: 'regions', label: tr('admin.esimAssign.tabRegions') },
  ];

  // ── Success state replaces the form entirely ──────────────────────
  if (vm.result) {
    return (
      <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 32 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${t.accent.teal}1A`, alignItems: 'center', justifyContent: 'center' }}>
              <Check size={30} color={t.accent.teal} strokeWidth={2.5} />
            </View>
            <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg, textAlign: 'center' }}>
              {tr('admin.esimAssign.successTitle')}
            </Text>
            <Text style={{ fontSize: 14, color: t.fgMuted, textAlign: 'center' }}>
              {vm.result.providerOrderNo
                ? tr('admin.esimAssign.successBody', { orderNo: vm.result.providerOrderNo })
                : tr('admin.esimAssign.successNoOrderNo')}
            </Text>
          </View>
          <PrimaryButton label={tr('admin.esimAssign.viewOrders')} onPress={vm.goOrders} />
          <Pressable onPress={vm.reset} accessibilityRole="button" style={{ padding: 14, alignItems: 'center' }}>
            <Text style={{ color: t.primary, fontWeight: '700' }}>{tr('admin.esimAssign.assignAnother')}</Text>
          </Pressable>
        </ScrollView>
      </ScreenSafeArea>
    );
  }

  // ── Step 1: customer ───────────────────────────────────────────────
  const customerSection = (
    <View style={{ gap: 8 }}>
      <Text style={sectionLabel}>{tr('admin.esimAssign.stepCustomer')}</Text>
      {vm.selectedUser ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: t.radius.md, backgroundColor: t.bgElev, borderColor: t.primary, borderWidth: 1.5 }}>
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
            placeholder={tr('admin.esimAssign.searchPlaceholder')}
            placeholderTextColor={t.fgFaint}
            style={inputStyle}
          />
          <View style={{ ...card, maxHeight: 260 }}>
            {vm.loadingUsers ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <ActivityIndicator color={t.primary} />
              </View>
            ) : vm.users.length === 0 ? (
              <View style={{ padding: 16, gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: t.fg }}>{tr('admin.esimAssign.noUsers')}</Text>
                {/* Only registered customers can be assigned to — there is no
                    admin account-creation flow. Say so instead of dead-ending. */}
                <Text style={{ fontSize: 12, color: t.fgMuted, lineHeight: 18 }}>{tr('admin.esimAssign.signUpFirst')}</Text>
              </View>
            ) : (
              <ScrollView>
                {vm.users.map((u) => (
                  <Pressable
                    key={u.id}
                    onPress={() => vm.selectUser(u)}
                    accessibilityRole="button"
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderBottomColor: t.border, borderBottomWidth: 1 }}
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
  );

  // ── Step 2: destination + plan ─────────────────────────────────────
  const bundleSection = (
    <View style={{ gap: 8 }}>
      <Text style={sectionLabel}>{tr('admin.esimAssign.stepBundle')}</Text>

      {vm.selectedPlace ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: t.radius.md, backgroundColor: t.bgElev, borderColor: t.primary, borderWidth: 1.5 }}>
          <MapPin size={18} color={t.primary} strokeWidth={2} />
          <Text style={{ flex: 1, fontWeight: '700', color: t.fg }}>{vm.selectedPlace.name}</Text>
          <Pressable onPress={() => vm.selectPlace(null)} accessibilityRole="button" accessibilityLabel={tr('a11y.back')} style={{ padding: 8 }}>
            <X size={18} color={t.fgMuted} />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {tabs.map((tabItem) => {
              const active = vm.tab === tabItem.id;
              return (
                <Pressable
                  key={tabItem.id}
                  onPress={() => vm.setTab(tabItem.id)}
                  accessibilityRole="button"
                  style={{ flex: 1, paddingVertical: 9, borderRadius: t.radius.sm, alignItems: 'center', backgroundColor: active ? t.primary : t.bgElev, borderColor: active ? t.primary : t.border, borderWidth: 1 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? t.onPrimary : t.fgMuted }}>{tabItem.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={vm.placeSearch}
            onChangeText={vm.setPlaceSearch}
            placeholder={tr('admin.esimAssign.searchPlaces')}
            placeholderTextColor={t.fgFaint}
            style={inputStyle}
          />
          <View style={{ ...card, maxHeight: 240 }}>
            {vm.loadingPlaces ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <ActivityIndicator color={t.primary} />
              </View>
            ) : (
              <ScrollView>
                {vm.places.map((p) => (
                  <Pressable
                    key={`${p.isRegion ? 'r' : 'c'}-${p.code}`}
                    onPress={() => vm.selectPlace(p)}
                    accessibilityRole="button"
                    style={{ paddingHorizontal: 12, paddingVertical: 11, borderBottomColor: t.border, borderBottomWidth: 1 }}
                  >
                    <Text style={{ fontWeight: '600', color: t.fg }}>{p.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </>
      )}

      {vm.selectedPlace && (
        <View style={{ gap: 10 }}>
          {vm.loadingBundles ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator color={t.primary} />
            </View>
          ) : vm.bundlesError ? (
            <Text style={{ fontSize: 13, color: t.danger }}>{vm.bundlesError}</Text>
          ) : vm.groups.length === 0 ? (
            <Text style={{ fontSize: 13, color: t.fgMuted }}>{tr('admin.esimAssign.noBundles')}</Text>
          ) : (
            vm.groups.map((group) => (
              <View key={group.days} style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgFaint }}>
                  {tr('admin.esimAssign.daysGroup', { count: group.days })}
                </Text>
                {group.items.map((b) => {
                  const active = vm.selectedBundle?.id === b.id;
                  return (
                    <PressableScale
                      key={b.id}
                      onPress={() => vm.selectBundle(b)}
                      accessibilityRole="button"
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: t.radius.md, backgroundColor: t.bgElev, borderColor: active ? t.primary : t.border, borderWidth: active ? 1.5 : 1 }}
                    >
                      <Text style={{ flex: 1, fontWeight: '600', color: t.fg }}>{vm.bundleLabel(b)}</Text>
                      <Text style={{ fontWeight: '700', color: t.fg }}>{vm.priceLabel(b)}</Text>
                      {active && <Check size={16} color={t.primary} strokeWidth={2.5} />}
                    </PressableScale>
                  );
                })}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );

  // ── Step 3: confirm ────────────────────────────────────────────────
  const confirmSection = (
    <View style={{ gap: 10 }}>
      <Text style={sectionLabel}>{tr('admin.esimAssign.stepConfirm')}</Text>
      {!vm.selectedUser ? (
        <Text style={{ fontSize: 13, color: t.fgMuted }}>{tr('admin.esimAssign.pickCustomer')}</Text>
      ) : !vm.selectedBundle ? (
        <Text style={{ fontSize: 13, color: t.fgMuted }}>{tr('admin.esimAssign.pickPlace')}</Text>
      ) : (
        <View style={{ ...card, padding: 14, gap: 10 }}>
          <Row label={tr('admin.esimAssign.stepCustomer')} value={`${vm.selectedUser.name} · ${vm.selectedUser.phone}`} t={t} />
          <Row label={tr('admin.esimAssign.stepBundle')} value={`${vm.selectedPlace?.name ?? ''} · ${vm.bundleLabel(vm.selectedBundle)} · ${vm.selectedBundle.days}d`} t={t} />
          <Row label={tr('admin.esimAssign.retailPrice')} value={vm.summaryPrice ?? ''} t={t} strong />
          <Text style={{ fontSize: 12, color: t.fgMuted, lineHeight: 18 }}>{tr('admin.esimAssign.paidWith')}</Text>
          {!!vm.duplicateWarning && (
            <Text style={{ fontSize: 12, color: t.accent.amber, lineHeight: 18 }}>{vm.duplicateWarning}</Text>
          )}
        </View>
      )}
      {!!vm.error && <Text style={{ fontSize: 13, color: t.danger }}>{vm.error}</Text>}
      <PrimaryButton
        label={vm.submitting ? tr('admin.esimAssign.submitting') : tr('admin.esimAssign.submit')}
        onPress={vm.submit}
        disabled={!vm.canSubmit}
      />
    </View>
  );

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={vm.goBack} accessibilityRole="button" accessibilityLabel={tr('a11y.back')} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Gift size={20} color={t.primary} strokeWidth={2} />
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            {tr('admin.esimAssign.title')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: vm.isWide ? 28 : 20,
          paddingBottom: 40,
          gap: 20,
          maxWidth: vm.isWide ? 1000 : 640,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <View style={{ flexDirection: vm.isWide ? 'row' : 'column', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: vm.isWide ? 1 : undefined, width: vm.isWide ? undefined : '100%', gap: 20 }}>
            {customerSection}
            {bundleSection}
          </View>
          <View style={{ flex: vm.isWide ? 1 : undefined, width: vm.isWide ? undefined : '100%' }}>
            {confirmSection}
          </View>
        </View>
      </ScrollView>
    </ScreenSafeArea>
  );
}

function Row({ label, value, t, strong }: { label: string; value: string; t: any; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <Text style={{ fontSize: 12, color: t.fgMuted, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: strong ? 15 : 13, fontWeight: '700', color: t.fg, flex: 1.4, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}
