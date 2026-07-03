// THIN UI — wiring lives in useActiveEsimCard.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Signal, AlertCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { DirectionalChevron } from './DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { useActiveEsimCard } from './useActiveEsimCard';
import { Flag } from './Flag';
import { PressableScale } from './PressableScale';
import { EsimCardSkeleton } from './Skeleton';

/**
 * Home widget that surfaces eSIM lifecycle even when the customer only
 * bought an eSIM (no trip). Shows each active eSIM's remaining data + days.
 * Shows a skeleton while the first snapshot loads and an inline retry row when
 * that load fails; renders nothing when there are genuinely no active eSIMs.
 */
export function ActiveEsimCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { items, headerTitle, goEsim, loading, errored, retry } = useActiveEsimCard();

  if (loading) return <EsimCardSkeleton />;

  if (errored) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 14,
          borderRadius: 16,
          backgroundColor: t.bgElev,
          borderColor: t.border,
          borderWidth: 1,
          ...t.shadow1,
        }}
      >
        <AlertCircle size={18} color={t.danger} />
        <Text style={{ flex: 1, fontSize: 12, color: t.fgMuted }}>{tr('common.error')}</Text>
        <Pressable
          onPress={retry}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => ({
            paddingVertical: 7,
            paddingHorizontal: 12,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: t.primary,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: t.primary, fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>
            {tr('common.tryAgain')}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Signal size={16} color={t.success} strokeWidth={2.2} />
        <Text
          style={{
            fontFamily: t.font.display,
            fontWeight: '700',
            fontSize: 18,
            color: t.fg,
            letterSpacing: -0.3,
          }}
        >
          {headerTitle}
        </Text>
      </View>

      {items.map((e) => (
        <PressableScale
          key={e.id}
          onPress={() => goEsim(e.id)}
          scaleTo={0.98}
          style={{
            backgroundColor: t.bgElev,
            borderColor: t.border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
            ...t.shadow1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Flag iso={e.iso} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>
                {e.country}
              </Text>
              <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                {e.planSummary}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                {e.amountLabel}
              </Text>
              <Text style={{ fontSize: 11, color: t.fgMuted }}>{e.amountSub}</Text>
            </View>
            <DirectionalChevron direction="forward" size={18} color={t.fgFaint} />
          </View>

          <View style={{ marginTop: 12 }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: t.bgSunken, overflow: 'hidden' }}>
              <View style={{ width: `${e.barPct}%`, height: 6, borderRadius: 3, backgroundColor: e.barColor }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: t.fgMuted }}>{e.usedLabel}</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: e.lowTint }}>{e.timeLabel}</Text>
            </View>
          </View>
        </PressableScale>
      ))}
    </View>
  );
}
