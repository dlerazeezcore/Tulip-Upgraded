import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Signal } from 'lucide-react-native';
import { DirectionalChevron } from './DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { useEsimStore } from '@/state/esimStore';
import { useEsimUsageFormatters } from '@/lib/esimUsage';
import { Flag } from './Flag';
import { PressableScale } from './PressableScale';

/**
 * Home widget that surfaces eSIM lifecycle even when the customer only
 * bought an eSIM (no trip). Shows each active eSIM's remaining data + days.
 * Renders nothing when there are no active eSIMs.
 */
export function ActiveEsimCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmt = useEsimUsageFormatters();
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
          {active.length > 1 ? tr('home.activeEsims') : tr('home.activeEsim')}
        </Text>
      </View>

      {active.map((e) => {
        // Use raw MB for the fraction so the bar reflects byte-level usage,
        // not the floored display-GB (974 MB must not read as a full 1 GB).
        const planMb = e.planGb * 1024;
        // FE-2: when the plan isn't GB-denominated (planGb 0) we can't compute a
        // fraction — show a full bar if data remains rather than a misleading empty one.
        const frac = e.unlimited ? 1 : planMb > 0 ? e.remainingMb / planMb : e.remainingMb > 0 ? 1 : 0;
        const low = !e.unlimited && (frac <= 0.2 || e.hoursLeft <= 48);
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
                  {e.unlimited
                    ? tr('home.planSummaryUnlimited', { days: e.planDays })
                    : tr('home.planSummary', { gb: e.planGb, days: e.planDays })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                  {e.unlimited ? '∞' : fmt.dataAmount(e.remainingMb)}
                </Text>
                <Text style={{ fontSize: 11, color: t.fgMuted }}>{e.unlimited ? tr('home.unlimitedShort') : tr('home.left')}</Text>
              </View>
              <DirectionalChevron direction="forward" size={18} color={t.fgFaint} />
            </View>

            <View style={{ marginTop: 12 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: t.bgSunken, overflow: 'hidden' }}>
                <View style={{ width: `${Math.max(0, Math.min(frac, 1)) * 100}%`, height: 6, borderRadius: 3, backgroundColor: barColor }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: t.fgMuted }}>
                  {e.unlimited ? '—' : tr('home.used', { value: fmt.dataAmount(e.usedMb) })}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: low ? t.warning : t.fgMuted }}>
                  {fmt.timeRemaining(e.hoursLeft)}
                </Text>
              </View>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}
