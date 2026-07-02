// THIN UI — wiring lives in useActiveEsimCard.ts.
import React from 'react';
import { View, Text } from 'react-native';
import { Signal } from 'lucide-react-native';
import { DirectionalChevron } from './DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { useActiveEsimCard } from './useActiveEsimCard';
import { Flag } from './Flag';
import { PressableScale } from './PressableScale';

/**
 * Home widget that surfaces eSIM lifecycle even when the customer only
 * bought an eSIM (no trip). Shows each active eSIM's remaining data + days.
 * Renders nothing when there are no active eSIMs.
 */
export function ActiveEsimCard() {
  const t = useTheme();
  const { items, headerTitle, goEsim } = useActiveEsimCard();

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
