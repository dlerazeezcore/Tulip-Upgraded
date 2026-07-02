import React from 'react';
import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';

/**
 * Consistent, on-brand empty state: a soft icon badge + title + subtitle, with
 * an optional action slot. Replaces the ad-hoc "No X yet" Text blocks scattered
 * across screens so every empty list looks intentional.
 */
export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  tone = 'muted',
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** 'muted' (default) for empty lists, 'primary' to draw the eye for CTAs. */
  tone?: 'muted' | 'primary';
}) {
  const t = useTheme();
  const accent = tone === 'primary' ? t.primary : t.fgFaint;
  const badgeBg = tone === 'primary' ? t.infoBg : t.bgSunken;
  return (
    <View style={{ alignItems: 'center', paddingVertical: 44, paddingHorizontal: 28, gap: 12 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: badgeBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={30} color={accent} strokeWidth={1.9} />
      </View>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg, textAlign: 'center' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center', lineHeight: 19, maxWidth: 320 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View style={{ marginTop: 4 }}>{action}</View> : null}
    </View>
  );
}
