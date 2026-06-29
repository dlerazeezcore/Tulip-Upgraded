import React from 'react';
import { ActivityIndicator, Pressable, Text, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

type Props = {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'ghost';
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
  const ghost = variant === 'ghost';
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
          paddingVertical: 12,
          paddingHorizontal: 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderWidth: ghost ? 1.5 : 0,
          borderColor: ghost ? t.border : 'transparent',
          opacity: blocked ? 0.55 : pressed ? 0.85 : 1,
        },
        !ghost && t.shadowGlow,
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={ghost ? t.fg : t.onPrimary} /> : icon}
      <Text
        style={{
          color: ghost ? t.fg : t.onPrimary,
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
