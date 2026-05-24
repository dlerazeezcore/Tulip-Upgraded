import React from 'react';
import { Pressable, Text, View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

type Props = {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'ghost';
};

export function PrimaryButton({ label, onPress, icon, style, variant = 'primary' }: Props) {
  const t = useTheme();
  const ghost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
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
          opacity: pressed ? 0.85 : 1,
        },
        !ghost && t.shadowGlow,
        style,
      ]}
    >
      {icon}
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
