import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import type { Theme } from '@/theme/tokens';

/**
 * Colour the Android system navigation bar to match the app surface.
 *
 * IMPORTANT: on Android 15 (targetSdkVersion 35) edge-to-edge is enforced by
 * the OS, so `setPositionAsync('relative')` and `setBackgroundColorAsync` are
 * effectively no-ops there — the system nav bar is a transparent overlay by
 * design and can NOT be made to "reserve" its own space. The real defense
 * against the nav bar covering content is per-screen safe-area insets
 * (`useSafeAreaInsets().bottom`) — see `TulipTabBar` and the eSIM plan footer,
 * which pad their bottom edge by the inset so nothing hides underneath.
 *
 * These calls still help on older Android versions, so keep them — but make
 * each best-effort and INDEPENDENT so a call that throws/na-ops on Android 15
 * never skips the others. No-op on iOS and web.
 */
export async function applySystemNavBar(theme: Theme): Promise<void> {
  if (Platform.OS !== 'android') return;
  // Non-overlay position (older Android only; no-op under edge-to-edge).
  try {
    await NavigationBar.setPositionAsync('relative');
  } catch {
    // Best-effort: never let nav-bar styling crash app startup.
  }
  // Theme-matched bar colour + button contrast.
  try {
    await NavigationBar.setBackgroundColorAsync(theme.bgElev);
    await NavigationBar.setButtonStyleAsync(theme.mode === 'dark' ? 'light' : 'dark');
  } catch {
    // Best-effort.
  }
}
