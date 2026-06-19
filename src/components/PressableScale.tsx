import React from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
};

export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  onHoverIn,
  onHoverOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  // Web-only subtle hover lift. onHoverIn/onHoverOut never fire on native, so
  // `lift` stays 0 there and the transform is unchanged (mobile byte-for-byte).
  const lift = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: lift.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { mass: 0.4, damping: 18, stiffness: 320 });
        if (haptic) {
          Haptics.selectionAsync().catch(() => {});
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { mass: 0.4, damping: 16, stiffness: 280 });
        onPressOut?.(e);
      }}
      onHoverIn={(e) => {
        lift.value = withSpring(-3, { mass: 0.4, damping: 18, stiffness: 320 });
        onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        lift.value = withSpring(0, { mass: 0.4, damping: 16, stiffness: 280 });
        onHoverOut?.(e);
      }}
      onPress={onPress}
      style={[animatedStyle, style as any]}
    >
      {children as any}
    </AnimatedPressable>
  );
}
