// THIN UI — wiring lives in src/screens/esim-store/usePlacePackages.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Globe, Check, Infinity as InfinityIcon, X, ArrowRight, Clock } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { usePlacePackages } from '@/screens/esim-store/usePlacePackages';

export default function PlaceDetail() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = usePlacePackages();
  const { name, iso, money } = vm;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.back')}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {iso ? <Flag iso={iso} size={30} /> : <Globe size={24} color={t.primary} strokeWidth={2} />}
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>{name}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: vm.isWide ? 28 : 20, paddingBottom: 120, gap: 16, maxWidth: vm.isWide ? 960 : 780, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {vm.isRegion && vm.coverage.length > 0 && (
          <PressableScale
            onPress={() => vm.setCoverageOpen(true)}
            scaleTo={0.98}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: t.brand.blue50, borderWidth: 1, borderColor: t.brand.blue100 }}
          >
            <Globe size={20} color={t.primary} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.brand.blue800 }}>
                {tr('esimStore.coverageCount', { count: vm.coverage.length })}
              </Text>
              <Text style={{ fontSize: 12, color: t.brand.blue700, marginTop: 1 }}>{tr('esimStore.coverageHint')}</Text>
            </View>
            <Check size={18} color={t.primary} />
          </PressableScale>
        )}

        {vm.loading ? (
          <View style={{ gap: 14 }}>
            {[0, 1].map((s) => (
              <View key={s} style={{ gap: 10 }}>
                <Skeleton width={96} height={26} radius={t.radius.pill} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {[0, 1, 2, 3].map((c) => (
                    <Skeleton key={c} width={vm.isWide ? 220 : '47%'} height={120} radius={t.radius.md} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : vm.groups.length === 0 ? (
          <EmptyState
            icon={Globe}
            title={tr('esimStore.noPlans', { name })}
            subtitle={tr('esimStore.noPlansSub')}
          />
        ) : (
          vm.groups.map((g) => (
            <View key={g.days} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
                    backgroundColor: t.brand.blue50, borderWidth: 1, borderColor: t.brand.blue100,
                  }}
                >
                  <Clock size={13} color={t.primary} strokeWidth={2.4} />
                  <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '800', fontSize: 12, color: t.primary, letterSpacing: 0.3 }}>
                    {g.days === 1 ? tr('esimStore.dayOne') : tr('esimStore.daysN', { count: g.days })}
                  </Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: vm.isWide ? -5 : 0, gap: vm.isWide ? 0 : 10 }}>
                {g.items.map((b) => {
                  const isSelected = vm.selected?.id === b.id;
                  return (
                    <View key={b.id} style={{ width: vm.isWide ? '50%' : '100%', padding: vm.isWide ? 5 : 0 }}>
                      <PressableScale
                        onPress={() => vm.setSelected(b)}
                        scaleTo={0.98}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16,
                          backgroundColor: t.bgElev, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? t.primary : t.border, ...t.shadow1,
                        }}
                      >
                        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                          {b.type === 'unlimited' ? (
                            <InfinityIcon size={22} color={t.accent.emerald} strokeWidth={2.2} />
                          ) : (
                            <Text style={{ fontFamily: t.font.display, fontWeight: '800', fontSize: 15, color: t.accent.emerald }}>{b.gb}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                            {b.type === 'unlimited' ? tr('esimStore.unlimited') : `${b.gb} GB`}
                          </Text>
                          <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{tr('esimStore.validForDays', { count: b.days })}</Text>
                        </View>
                        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>{money(b.usd)}</Text>
                        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: isSelected ? t.primary : t.borderStrong, backgroundColor: isSelected ? t.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                        </View>
                      </PressableScale>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {vm.selected && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 28, backgroundColor: t.bgElev, borderTopWidth: 1, borderTopColor: t.border }}>
          <View style={{ maxWidth: 780, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: t.fgMuted }}>
                {vm.selected.type === 'unlimited' ? tr('esimStore.unlimited') : `${vm.selected.gb} GB`} · {vm.selected.days} {tr('esim.days')}
              </Text>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{money(vm.selected.usd)}</Text>
            </View>
            <PrimaryButton label={tr('common.continue')} icon={<ArrowRight size={16} color="#fff" strokeWidth={2.2} />} onPress={vm.onContinue} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      <Modal visible={vm.coverageOpen} transparent animationType="slide" onRequestClose={() => vm.setCoverageOpen(false)}>
        <Pressable onPress={() => vm.setCoverageOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '76%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('esimStore.coverageTitle', { name })}</Text>
              <Pressable onPress={() => vm.setCoverageOpen(false)} accessibilityRole="button" accessibilityLabel={tr('a11y.close')}><X size={20} color={t.fgMuted} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {vm.coverage.map((c) => (
                <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, backgroundColor: t.bgSunken }}>
                  <Flag iso={c} size={18} />
                  <Text style={{ fontSize: 12, color: t.fg, fontWeight: '600' }}>{vm.nameByCode[c] || c}</Text>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
