import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Signal, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useEsimStore } from '@/state/esimStore';
import { Flag } from './Flag';
import { PressableScale } from './PressableScale';

/**
 * Home widget that surfaces eSIM lifecycle even when the customer only
 * bought an eSIM (no trip). Shows each active eSIM's remaining data + days.
 * Renders nothing when there are no active eSIMs.
 */
export function ActiveEsimCard() {
  const t = useTheme();
  const router = useRouter();
  const esims = useEsimStore((s) => s.esims);
  const active = esims.filter((e) => e.status === 'active');

  if (active.length === 0) return null;

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
          Active eSIM{active.length > 1 ? 's' : ''}
        </Text>
      </View>

      {active.map((e) => {
        const remaining = e.remainingGb;
        const frac = e.unlimited ? 1 : e.planGb > 0 ? remaining / e.planGb : 0;
        const low = !e.unlimited && (frac <= 0.2 || e.daysLeft <= 2);
        const barColor = low ? t.warning : t.success;
        return (
          <PressableScale
            key={e.id}
            onPress={() => router.push(`/esim/${e.id}`)}
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
                  {e.planGb} GB · {e.planDays}-day plan
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                  {e.unlimited ? '∞' : `${remaining.toFixed(1)} GB`}
                </Text>
                <Text style={{ fontSize: 11, color: t.fgMuted }}>{e.unlimited ? 'unlimited' : 'left'}</Text>
              </View>
              <ChevronRight size={18} color={t.fgFaint} />
            </View>

            <View style={{ marginTop: 12 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: t.bgSunken, overflow: 'hidden' }}>
                <View style={{ width: `${frac * 100}%`, height: 6, borderRadius: 3, backgroundColor: barColor }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: t.fgMuted }}>
                  {e.usedGb.toFixed(1)} GB used
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: low ? t.warning : t.fgMuted }}>
                  {e.daysLeft} days left
                </Text>
              </View>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}
