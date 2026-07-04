// THIN UI — wiring lives in src/screens/esim-store/useEsimStore.ts.
import React, { useCallback } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Search, Globe } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PressableScale } from '@/components/PressableScale';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

import type { LocationCountry } from '@/services/esim';
import { useEsimStore } from '@/screens/esim-store/useEsimStore';
import { EsimCompatibilityBanner } from '@/components/EsimCompatibilityBanner';

export default function EsimStore() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useEsimStore();
  const { isWide, tab, tabs, q, popular, regions, loadingCountries, filteredCountries } = vm;

  // Memoized renderItem for the countries FlatList — prevents recreating closures
  // on every re-render, lets RN bail out of re-rendering rows whose data unchanged.
  const renderCountryRow = useCallback(
    ({ item, index }: { item: LocationCountry; index: number }) => (
      <Pressable
        onPress={() => vm.openPlace(item.code, item.name)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderBottomWidth: index === filteredCountries.length - 1 ? 0 : 1,
          borderBottomColor: t.border,
        }}
      >
        <Flag iso={item.code} size={28} />
        <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 14, color: t.fg }}>{item.name}</Text>
        <DirectionalChevron direction="forward" size={16} color={t.fgFaint} />
      </Pressable>
    ),
    [filteredCountries.length, t.border, t.fg, t.fgFaint, t.font.displayMedium, vm.openPlace],
  );

  // Shared header: back button + title. Renders for every tab.
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
      <Pressable
        onPress={vm.goBack}
        accessibilityRole="button"
        accessibilityLabel={tr('a11y.back')}
        hitSlop={4} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
      >
        <DirectionalChevron direction="back" size={18} color={t.fg} />
      </Pressable>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Globe size={20} color={t.accent.emerald} strokeWidth={2} />
        <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>{tr('esimStore.title')}</Text>
      </View>
    </View>
  );

  // Tab switcher — used by all three tabs (as ScrollView child OR FlatList ListHeader).
  const tabSwitcher = (
    <View style={{ flexDirection: 'row', backgroundColor: t.bgSunken, borderRadius: 12, padding: 4 }}>
      {tabs.map((tb) => {
        const on = tb.id === tab;
        return (
          <Pressable
            key={tb.id}
            onPress={() => vm.setTab(tb.id)}
            style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: on ? t.bgElev : 'transparent', ...(on ? t.shadow1 : {}) }}
          >
            <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 13, color: on ? t.fg : t.fgMuted }}>
              {tb.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // ─── Countries tab ─── uses FlatList (virtualized; only visible rows render),
  // because the provider list is 200+ items and rendering all of them via .map()
  // inside a ScrollView froze the JS thread (could not tap rows, app crashed).
  if (tab === 'countries') {
    const listHeader = (
      <View style={{ padding: isWide ? 28 : 20, paddingBottom: 16, gap: 16, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center' }}>
        {tabSwitcher}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: t.bgSunken }}>
          <Search size={18} color={t.fgMuted} />
          <TextInput
            value={q}
            onChangeText={vm.setQ}
            placeholder={tr('esimStore.searchCountry')}
            placeholderTextColor={t.fgFaint}
            autoCapitalize="none"
            style={{ flex: 1, fontSize: 14, color: t.fg, fontFamily: t.font.bodyMedium, paddingVertical: 2 }}
          />
        </View>
      </View>
    );
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
        {header}
        {/* Device eSIM check is native-only (real detection needs the native
            module) and shows an unhelpful "couldn't confirm" on web — hide it on
            the desktop web layout; keep it on native + mobile web. */}
        {!isWide && (
          <View style={{ paddingHorizontal: 20, paddingTop: 8, maxWidth: 900, width: '100%', alignSelf: 'center' }}>
            <EsimCompatibilityBanner />
          </View>
        )}
        {loadingCountries ? (
          <>
            {listHeader}
            {/* Skeleton mirrors the real country rows (card chrome, flag, name, chevron)
                so the loaded list doesn't jump. */}
            <View style={{ paddingHorizontal: isWide ? 28 : 20, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center' }}>
              <View style={{ backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderBottomWidth: i === 7 ? 0 : 1,
                      borderBottomColor: t.border,
                    }}
                  >
                    <Skeleton width={28} height={28} radius={14} />
                    <View style={{ flex: 1 }}>
                      <Skeleton width={`${50 + ((i * 7) % 30)}%`} height={14} />
                    </View>
                    <Skeleton width={16} height={16} radius={8} />
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <FlatList
            data={filteredCountries}
            keyExtractor={(c) => c.code}
            renderItem={renderCountryRow}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <EmptyState
                icon={Search}
                title={q.trim() ? tr('esimStore.noMatch', { q }) : tr('esimStore.noCountries')}
              />
            }
            getItemLayout={vm.getCountryItemLayout}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: isWide ? 28 : 20, paddingBottom: 40, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center', backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden', marginHorizontal: isWide ? 28 : 20 }}
            style={{ flex: 1 }}
          />
        )}
      </SafeAreaView>
    );
  }

  // ─── Popular + Regions ─── small lists; ScrollView is fine.
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      {header}
      {/* Native-only device check — hidden on desktop web (see note above). */}
      {!isWide && (
        <View style={{ paddingHorizontal: 20, paddingTop: 8, maxWidth: 900, width: '100%', alignSelf: 'center' }}>
          <EsimCompatibilityBanner />
        </View>
      )}
      <ScrollView
        contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 40, gap: 16, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tabSwitcher}

        {tab === 'popular' && (
          <View style={{ gap: 10 }}>
            {popular.length === 0 ? (
              <EmptyState icon={Globe} title={tr('esimStore.noPopularTitle')} subtitle={tr('esimStore.noPopular')} />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: isWide ? -5 : 0, gap: isWide ? 0 : 10 }}>
                {popular.map((c) => (
                  <View key={c.code} style={{ width: isWide ? '50%' : '100%', padding: isWide ? 5 : 0 }}>
                    <PressableScale
                      onPress={() => vm.openPlace(c.code, c.displayName)}
                      scaleTo={0.98}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}
                    >
                      <Flag iso={c.code} size={34} />
                      <Text style={{ flex: 1, fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>{c.displayName}</Text>
                      <DirectionalChevron direction="forward" size={20} color={t.fgFaint} />
                    </PressableScale>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {tab === 'regions' && (
          regions.length === 0 ? (
            // Same bordered-row skeleton as the Countries tab, for one consistent look.
            <View style={{ backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={i}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: i === 7 ? 0 : 1, borderBottomColor: t.border }}
                >
                  <Skeleton width={28} height={28} radius={14} />
                  <View style={{ flex: 1 }}><Skeleton width={`${50 + ((i * 7) % 30)}%`} height={14} /></View>
                  <Skeleton width={16} height={16} radius={8} />
                </View>
              ))}
            </View>
          ) : (
            // Clean list rows matching the Countries tab — a globe glyph stands in
            // for the (multi-country) region where a flag would be. Regions come
            // straight from the provider API (getRegions, type=2) — no curation.
            <View style={{ backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
              {regions.map((r, index) => (
                <Pressable
                  key={r.code}
                  onPress={() => vm.openRegion(r.code, r.name)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: index === regions.length - 1 ? 0 : 1, borderBottomColor: t.border }}
                >
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={16} color={t.accent.emerald} strokeWidth={2} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 14, color: t.fg }}>{r.name}</Text>
                  <DirectionalChevron direction="forward" size={16} color={t.fgFaint} />
                </Pressable>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
