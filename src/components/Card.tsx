import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export function Card({
  children,
  style,
  padding = 16,
  radius,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.bgElev,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: radius ?? t.radius.lg,
          padding,
        },
        t.shadow1,
        style,
      ]}
    >
      {children}
    </View>
  );
}
