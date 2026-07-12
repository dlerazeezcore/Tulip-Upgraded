// THIN UI — wiring lives in src/screens/esim-store/useEsimStore.ts.
import React, { useCallback } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, Globe } from 'lucide-react-native';
import { StackHeader } from '@/components/StackHeader';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PressableScale } from '@/components/PressableScale';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';

import type { LocationCountry } from '@/services/esim';
import { useEsimStore } from '@/screens/esim-store/useEsimStore';
import { EsimCompatibilityBanner } from '@/components/EsimCompatibilityBanner';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';

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
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderBottomWidth: index === filteredCountries.length - 1 ? 0 : 1,
          borderBottomColor: t.border,
          // Same press dimming as the orders rows — drill-in rows should react.
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Flag iso={item.code} size={28} />
        <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 14, color: t.fg }}>{item.name}</Text>
        <DirectionalChevron direction="forward" size={16} color={t.fgFaint} />
      </Pressable>
    ),
    [filteredCountries.length, t.border, t.fg, t.fgFaint, t.font.displayMedium, vm.openPlace],
  );

  // Shared header: back button + globe + title. Renders for every tab.
  const header = (
    <StackHeader
      title={tr('esimStore.title')}
      onBack={vm.goBack}
      leading={<Globe size={20} color={t.accent.emerald} strokeWidth={2} />}
    />
  );

  // Tab switcher — used by all three tabs (as ScrollView child OR FlatList ListHeader).
  const tabSwitcher = (
    <View style={{ flexDirection: 'row', backgroundColor: t.bgSunken, borderRadius: t.radius.badge, padding: 4 }}>
      {tabs.map((tb) => {
        const on = tb.id === tab;
        return (
          <Pressable
            key={tb.id}
            onPress={() => vm.setTab(tb.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{ flex: 1, paddingVertical: 9, borderRadius: t.radius.segment, alignItems: 'center', backgroundColor: on ? t.bgElev : 'transparent', ...(on ? t.shadow1 : {}) }}
          >
            <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 13, color: on ? t.fg : t.fgMuted }}>
              {tb.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // Bordered-row skeleton shared by the three tabs' loading states — mirrors
  // the real rows (flag circle, name line, chevron) so loaded lists don't jump.
  const rowsSkeleton = (
    <View style={{ backgroundColor: t.bgElev, borderRadius: t.radius.md, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: i === 7 ? 0 : 1, borderBottomColor: t.border }}
        >
          <Skeleton width={28} height={28} radius={14} />
          <View style={{ flex: 1 }}>
            <Skeleton width={`${50 + ((i * 7) % 30)}%`} height={14} />
          </View>
          <Skeleton width={16} height={16} radius={8} />
        </View>
      ))}
    </View>
  );

  // ─── Countries tab ─── uses FlatList (virtualized; only visible rows render),
  // because the provider list is 200+ items and rendering all of them via .map()
  // inside a ScrollView froze the JS thread (could not tap rows, app crashed).
  if (tab === 'countries') {
    return (
      <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
        {header}
        {/* Device eSIM check is native-only (real detection needs the native
            module) and shows an unhelpful "couldn't confirm" on web — hide it on
            the desktop web layout; keep it on native + mobile web. */}
        {!isWide && (
          <View style={{ paddingHorizontal: 20, paddingTop: 8, maxWidth: 900, width: '100%', alignSelf: 'center' }}>
            <EsimCompatibilityBanner />
          </View>
        )}
        {/* Switcher + search stay OUTSIDE the list card and identical across
            loading/errored/loaded, so the header never re-nests or shifts when
            the load settles (and the search field stays reachable mid-scroll). */}
        <View style={{ padding: isWide ? 28 : 20, paddingBottom: 16, gap: 16, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center' }}>
          {tabSwitcher}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: t.radius.md, backgroundColor: t.bgSunken }}>
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
        {loadingCountries ? (
          <View style={{ paddingHorizontal: isWide ? 28 : 20, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center' }}>
            {rowsSkeleton}
          </View>
        ) : vm.countriesErrored ? (
          <ErrorState onRetry={vm.retry} />
        ) : (
          // Page padding lives on the wrapper and card chrome on the scrolled
          // content — never width+margin on the same container, which over-wide
          // the card and clipped the trailing chevrons (audit H1).
          <View style={{ flex: 1, paddingHorizontal: isWide ? 28 : 20, maxWidth: isWide ? 1120 : 900, width: '100%', alignSelf: 'center' }}>
            <FlatList
              data={filteredCountries}
              keyExtractor={(c) => c.code}
              renderItem={renderCountryRow}
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
              contentContainerStyle={{ backgroundColor: t.bgElev, borderRadius: t.radius.md, borderColor: t.border, borderWidth: 1, overflow: 'hidden', marginBottom: 40 }}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </ScreenSafeArea>
    );
  }

  // ─── Popular + Regions ─── small lists; ScrollView is fine.
  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
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
            {vm.popularErrored ? (
              <ErrorState onRetry={vm.retry} />
            ) : vm.popularLoading && popular.length === 0 ? (
              // Default landing tab must not flash "nothing here" pre-load.
              rowsSkeleton
            ) : popular.length === 0 ? (
              <EmptyState icon={Globe} title={tr('esimStore.noPopularTitle')} subtitle={tr('esimStore.noPopular')} />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: isWide ? -t.gridGutterHalf : 0, gap: isWide ? 0 : 10 }}>
                {popular.map((c) => (
                  <View key={c.code} style={{ width: isWide ? '50%' : '100%', padding: isWide ? t.gridGutterHalf : 0 }}>
                    <PressableScale
                      onPress={() => vm.openPlace(c.code, c.displayName)}
                      scaleTo={0.98}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: t.radius.card, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}
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
          vm.regionsErrored ? (
            <ErrorState onRetry={vm.retry} />
          ) : vm.regionsLoading && regions.length === 0 ? (
            rowsSkeleton
          ) : regions.length === 0 ? (
            // Loading is a real flag now, so a successful-but-empty region list
            // reads as empty instead of skeleton-ing forever (audit M3).
            <EmptyState icon={Globe} title={tr('esimStore.noRegionsTitle')} subtitle={tr('esimStore.noRegions')} />
          ) : (
            // Clean list rows matching the Countries tab — a globe glyph stands in
            // for the (multi-country) region where a flag would be. Regions come
            // straight from the provider API (getRegions, type=2) — no curation.
            <View style={{ backgroundColor: t.bgElev, borderRadius: t.radius.md, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
              {regions.map((r, index) => (
                <Pressable
                  key={r.code}
                  onPress={() => vm.openRegion(r.code, r.name)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: index === regions.length - 1 ? 0 : 1, borderBottomColor: t.border, opacity: pressed ? 0.85 : 1 })}
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
    </ScreenSafeArea>
  );
}
