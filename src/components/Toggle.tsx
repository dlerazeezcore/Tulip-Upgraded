import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useIsRTL } from '@/lib/rtl';

const W = 50;
const H = 30;
const PAD = 3;
const THUMB = H - PAD * 2;
const TRAVEL = W - THUMB - PAD * 2;

/** Reliable, animated toggle that works the same on web and native. */
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  const isRTL = useIsRTL();
  const p = useSharedValue(value ? 1 : 0);
  // In RTL the row is mirrored, so "on" is towards the visual left — negate the
  // travel or the thumb slides against the reading direction.
  const travel = isRTL ? -TRAVEL : TRAVEL;

  useEffect(() => {
    p.value = withTiming(value ? 1 : 0, { duration: 170 });
  }, [value, p]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [t.borderStrong, t.primary]),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: p.value * travel }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
        onChange(!value);
      }}
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View style={[{ width: W, height: H, borderRadius: H / 2, padding: PAD, justifyContent: 'center' }, trackStyle]}>
        <Animated.View
          style={[
            {
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: t.onPrimary,
              // CONV-19: use the token shadow instead of a hardcoded '#000'.
              ...t.shadow1,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
