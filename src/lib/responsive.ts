import { Platform, useWindowDimensions } from 'react-native';

/** True on web at desktop widths — used to switch to "web as web" layouts. */
export function useIsWideWeb(breakpoint = 1024): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= breakpoint;
}

/** Convenience: current width + wide flags for finer control. */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  return {
    width,
    height,
    isWeb,
    isWide: isWeb && width >= 1024,
    isWideXL: isWeb && width >= 1320,
  };
}
