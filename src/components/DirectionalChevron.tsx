import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useIsRTL } from '@/lib/rtl';

type Props = {
  /** 'forward' = drill-in / next (points along reading flow); 'back' = previous screen. */
  direction?: 'forward' | 'back';
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * A chevron that mirrors with the UI direction. Lucide glyphs and web SVGs don't
 * auto-flip under RTL, so use this instead of hard-coding ChevronRight/Left for
 * any directional affordance (back buttons, drill-in rows, carousels).
 */
export function DirectionalChevron({ direction = 'forward', size = 18, color, strokeWidth }: Props) {
  const isRTL = useIsRTL();
  const pointsRight = direction === 'forward' ? !isRTL : isRTL;
  const Icon = pointsRight ? ChevronRight : ChevronLeft;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
