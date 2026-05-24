import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';

type Props = {
  /** 0..1 fraction remaining */
  fraction: number;
  size?: number;
  stroke?: number;
  color?: string;
  centerTop: string;
  centerSub: string;
};

export function UsageRing({
  fraction,
  size = 180,
  stroke = 14,
  color,
  centerTop,
  centerSub,
}: Props) {
  const t = useTheme();
  const ringColor = color ?? t.primary;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, fraction));
  const dash = circumference * clamped;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={t.bgSunken}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text
        style={{
          fontFamily: t.font.display,
          fontWeight: '700',
          fontSize: 30,
          color: t.fg,
          letterSpacing: -0.6,
        }}
      >
        {centerTop}
      </Text>
      <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{centerSub}</Text>
    </View>
  );
}
