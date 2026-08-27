// Wiring for TulipSplash (THIN UI): owns the launch-animation timeline and the
// localized wordmark/tagline. Ported 1:1 from the Claude Design canvas
// "Tulip Booking splash screens" → artboard 1a "Deep blue — brand default".
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { brand } from '@/theme/tokens';

// The design system's single easing curve (tokens.css `--ease-out`).
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

/** Mark bloom → wordmark rise → tagline rise → loader fill, in ms. */
const MARK_MS = 520;
const TEXT_MS = 420;
const TAG_DELAY_MS = 140;
const BAR_DELAY_MS = 300;
const BAR_MS = 1400;

/**
 * Total time the launch screen wants on-screen before the app may replace it.
 * The root layout holds the splash for at least this long so a fast cold start
 * doesn't flash the animation for two frames and cut it off mid-bloom.
 */
export const SPLASH_MIN_MS = 1250;

/**
 * @param fontsLoaded Gates the wordmark + tagline. They are set in Outfit /
 *   Plus Jakarta Sans, which are still loading while this screen is up — text
 *   rendered before then would paint in the system fallback and visibly snap
 *   when the real face arrives. Holding it back costs nothing visually: the
 *   design already has the mark bloom alone before the wordmark rises.
 */
export function useTulipSplash(fontsLoaded: boolean) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  // Web matches the rest of the app (see useAnimatedScreen): render the settled
  // state rather than risk an animation that never runs leaving it invisible.
  const still = reducedMotion || Platform.OS === 'web';

  const mark = useSharedValue(still ? 1 : 0);
  const word = useSharedValue(still ? 1 : 0);
  const tag = useSharedValue(still ? 1 : 0);
  const bar = useSharedValue(still ? 1 : 0);

  useEffect(() => {
    if (still) return;
    mark.value = withTiming(1, { duration: MARK_MS, easing: EASE });
    bar.value = withDelay(BAR_DELAY_MS, withTiming(1, { duration: BAR_MS, easing: EASE }));
  }, [still, mark, bar]);

  useEffect(() => {
    if (still || !fontsLoaded) return;
    word.value = withTiming(1, { duration: TEXT_MS, easing: EASE });
    tag.value = withDelay(TAG_DELAY_MS, withTiming(1, { duration: TEXT_MS, easing: EASE }));
  }, [still, fontsLoaded, word, tag]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: mark.value,
    transform: [
      { translateY: (1 - mark.value) * 10 },
      { scale: 0.86 + 0.14 * mark.value },
    ],
  }));

  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * 12 }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tag.value,
    transform: [{ translateY: (1 - tag.value) * 12 }],
  }));

  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: bar.value }] }));

  return {
    appName: t('common.appName'),
    // The design's "Flights · Stays · eSIM · Rides" using the app's own
    // service vocabulary, so it localizes with the rest of the product.
    tagline: [
      t('serviceNames.flights'),
      t('serviceNames.hotels'),
      t('serviceNames.esim'),
      t('serviceNames.transfers'),
    ].join(' · '),
    gradient: [brand.blue500, brand.blue600, brand.blue700] as const,
    showText: fontsLoaded,
    markStyle,
    wordStyle,
    tagStyle,
    barStyle,
  };
}
