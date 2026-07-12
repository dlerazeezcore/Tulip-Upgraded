import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useIsRTL } from '@/lib/rtl';

type Props = {
  /** 'forward' = proceed / CTA (points along reading flow); 'back' = previous. */
  direction?: 'forward' | 'back';
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * An arrow that mirrors with the UI direction — the ArrowRight/Left sibling of
 * DirectionalChevron. Lucide glyphs don't auto-flip under RTL, so use this for
 * CTA arrows ("Open →", "Search →", "See all →") instead of a hard ArrowRight.
 */
export function DirectionalArrow({ direction = 'forward', size = 12, color, strokeWidth }: Props) {
  const isRTL = useIsRTL();
  const pointsRight = direction === 'forward' ? !isRTL : isRTL;
  const Icon = pointsRight ? ArrowRight : ArrowLeft;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
