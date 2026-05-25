import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

/**
 * Wraps screen content with a subtle fade + slide-up entrance.
 * Gives navigation a polished, native-feeling reveal.
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
  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(delay).springify().damping(18)}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </Animated.View>
  );
}
