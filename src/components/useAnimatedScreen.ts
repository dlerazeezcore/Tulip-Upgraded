// Wiring for AnimatedScreen (THIN UI): derives the entrance animation config.
import { Platform } from 'react-native';
import { FadeIn, useReducedMotion } from 'react-native-reanimated';

/**
 * Returns the screen-entrance `entering` config, or null when it must not
 * animate:
 * - OS "Reduce Motion" accessibility setting on (#23) — appear instantly.
 * - Web — reanimated's CSS-driven entering is unreliable here (the previous
 *   springified FadeInDown left the whole screen stuck at opacity 0 /
 *   translateY 25px after a reload: animationName was set but the animation
 *   never ran). Web renders instantly, which is also the platform-native feel.
 *
 * Native uses a quick fade WITHOUT translation: the old
 * FadeInDown(420ms).springify() shifted every screen 25px and spring-settled
 * it into place on each navigation, which users read as the page visibly
 * "re-organizing itself to fit the window" — compounding the Android 15
 * safe-area inset jump rather than masking it.
 */
export function useAnimatedScreen(delay: number) {
  const reducedMotion = useReducedMotion();
  const entering =
    reducedMotion || Platform.OS === 'web' ? null : FadeIn.duration(200).delay(delay);
  return { entering };
}
