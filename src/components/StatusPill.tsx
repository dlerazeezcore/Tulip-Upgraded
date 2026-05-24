import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export type PillKind = 'active' | 'upcoming' | 'inactive' | 'expired' | 'completed' | 'cancelled';

export function StatusPill({ kind, label }: { kind: PillKind; label?: string }) {
  const t = useTheme();
  const map: Record<PillKind, { bg: string; fg: string; text: string }> = {
    active:    { bg: 'rgba(22,163,74,0.14)',  fg: t.success, text: 'Active' },
    upcoming:  { bg: 'rgba(25,103,210,0.14)', fg: t.primary, text: 'Upcoming' },
    inactive:  { bg: 'rgba(245,158,11,0.16)', fg: t.warning, text: 'Not activated' },
    expired:   { bg: 'rgba(220,38,38,0.14)',  fg: t.danger,  text: 'Expired' },
    completed: { bg: t.bgSunken,              fg: t.fgMuted, text: 'Completed' },
    cancelled: { bg: 'rgba(220,38,38,0.14)',  fg: t.danger,  text: 'Cancelled' },
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
        borderRadius: 999,
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
