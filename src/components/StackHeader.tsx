// Shared stack-screen header — the canonical back-button + title chrome used by
// every pushed screen. Presentational only (no wiring hook needed): navigation
// stays in each screen's hook and arrives via `onBack`.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { DirectionalChevron } from '@/components/DirectionalChevron';

export function StackHeader({
  title,
  subtitle,
  onBack,
  leading,
  right,
}: {
  title: string;
  subtitle?: string | null;
  onBack: () => void;
  /** Optional element between the back button and the title (e.g. a flag/icon). */
  leading?: React.ReactNode;
  /** Optional trailing slot (e.g. a refresh button). Tappables need hitSlop ≥ 8. */
  right?: React.ReactNode;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={tr('a11y.back')}
        hitSlop={8}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
      >
        <DirectionalChevron direction="back" size={18} color={t.fg} />
      </Pressable>
      {leading}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          {title}
        </Text>
        {subtitle ? <Text style={{ fontSize: 11, color: t.fgMuted }}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
