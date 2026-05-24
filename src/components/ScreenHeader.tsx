import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: t.font.display,
            fontWeight: '700',
            fontSize: 28,
            letterSpacing: -0.6,
            color: t.fg,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4 }}>{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}
