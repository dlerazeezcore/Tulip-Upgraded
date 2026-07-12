import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

export type PillKind = 'active' | 'upcoming' | 'inactive' | 'expired' | 'completed' | 'cancelled';

export function StatusPill({ kind, label }: { kind: PillKind; label?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const map: Record<PillKind, { bg: string; fg: string; text: string }> = {
    active:    { bg: t.successBg, fg: t.successFg, text: tr('status.active') },
    upcoming:  { bg: t.infoBg,    fg: t.infoFg,    text: tr('status.upcoming') },
    inactive:  { bg: t.warningBg, fg: t.warningFg, text: tr('status.inactive') },
    expired:   { bg: t.dangerBg,  fg: t.dangerFg,  text: tr('status.expired') },
    completed: { bg: t.bgSunken,  fg: t.fgMuted,   text: tr('status.completed') },
    cancelled: { bg: t.dangerBg,  fg: t.dangerFg,  text: tr('status.cancelled') },
  };
  const s = map[kind];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 9,
        borderRadius: t.radius.pill,
        backgroundColor: s.bg,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.fg }} />
      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.4, color: s.fg }}>
        {(label ?? s.text).toUpperCase()}
      </Text>
    </View>
  );
}
