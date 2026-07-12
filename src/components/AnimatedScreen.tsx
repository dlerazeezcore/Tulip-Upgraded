// THIN UI — wiring lives in useAnimatedScreen.ts.
import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAnimatedScreen } from './useAnimatedScreen';

/**
 * Wraps screen content with a subtle fade + slide-up entrance.
 * Gives navigation a polished, native-feeling reveal.
 * Respects the OS "Reduce Motion" setting (renders without animation).
 */
export function AnimatedScreen({
  children,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}) {
  const { entering } = useAnimatedScreen(delay);
  return (
    <Animated.View entering={entering ?? undefined} style={[{ flex: 1 }, style]}>
      {children}
    </Animated.View>
  );
}
