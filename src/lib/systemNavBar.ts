import { Platform } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import type { Theme } from '@/theme/tokens';

/**
 * Match the Android system navigation bar buttons to the app theme.
 *
 * IMPORTANT: at targetSdkVersion 36 edge-to-edge is enforced by the OS and can
 * no longer be opted out of, so the nav bar is ALWAYS a transparent overlay.
 * `setPositionAsync` and `setBackgroundColorAsync` were removed from
 * expo-navigation-bar accordingly — there is no bar background left to colour.
 * All that remains controllable is the button/content contrast.
 *
 * The real defense against the nav bar covering content is per-screen safe-area
 * insets (`useSafeAreaInsets().bottom`) — see `TulipTabBar` and the eSIM plan
 * footer, which pad their bottom edge by the inset so nothing hides underneath.
 *
 * Note `NavigationBar.setStyle` takes the BAR style, which is the inverse of the
 * old `setButtonStyleAsync` BUTTON style: 'dark' means a dark bar with light
 * content, so a dark theme maps to 'dark'. No-op on iOS and web.
 */
export async function applySystemNavBar(theme: Theme): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    NavigationBar.setStyle(theme.mode === 'dark' ? 'dark' : 'light');
  } catch {
    // Best-effort: never let nav-bar styling crash app startup.
  }
}
