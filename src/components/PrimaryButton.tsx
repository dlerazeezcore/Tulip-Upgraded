import React from 'react';
import { ActivityIndicator, Pressable, Text, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

type Props = {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 'ghost' sits on normal surfaces (fg text, hairline border).
   * 'ghostOnPrimary' is the same outline shape for primary/hero surfaces —
   * onPrimary text + translucent onPrimary border, so it stays legible over
   * the brand gradient in both themes. */
  variant?: 'primary' | 'ghost' | 'ghostOnPrimary';
  /** Shows an inline spinner and blocks presses (prevents double-submit). */
  loading?: boolean;
  /** Dims the button and blocks presses. */
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  style,
  variant = 'primary',
  loading = false,
  disabled = false,
}: Props) {
  const t = useTheme();
  const ghost = variant === 'ghost' || variant === 'ghostOnPrimary';
  const contentColor = variant === 'ghostOnPrimary' ? t.onPrimary : ghost ? t.fg : t.onPrimary;
  const borderColor =
    variant === 'ghostOnPrimary' ? `${t.onPrimary}59` : ghost ? t.border : 'transparent';
  // UX-13: a busy/disabled button must not be tappable, and should read as such.
  const blocked = loading || disabled;
  return (
    <Pressable
      onPress={blocked ? undefined : onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        {
          backgroundColor: ghost ? 'transparent' : t.primary,
          borderRadius: t.radius.pill,
          minHeight: 48, // A11y (#24): keep the tap target at least 44pt regardless of text metrics.
          paddingVertical: 12,
          paddingHorizontal: 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderWidth: ghost ? 1.5 : 0,
          borderColor,
          opacity: blocked ? 0.55 : pressed ? 0.85 : 1,
        },
        !ghost && t.shadowGlow,
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={contentColor} /> : icon}
      <Text
        style={{
          color: contentColor,
          fontFamily: t.font.displayMedium,
          fontSize: 15,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
