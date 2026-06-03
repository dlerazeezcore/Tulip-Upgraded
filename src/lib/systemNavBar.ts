import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import type { Theme } from '@/theme/tokens';

/**
 * Make the Android system navigation bar opaque, theme-coloured, and
 * SPACE-RESERVING so it can never overlay the app's bottom tab bar.
 *
 * The reported bug: on some Android nav-bar modes the OS nav (gesture pill /
 * 3-button) was painted on top of TulipTabBar, hiding its labels — because the
 * app never told Android how to treat the nav bar, so a translucent/overlay
 * bar covered our content. Setting position 'relative' (non-overlay) makes the
 * OS reserve its own space below the app, and a solid background colour makes
 * it match the app surface in light/dark.
 *
 * No-op on iOS and web.
 */
export async function applySystemNavBar(theme: Theme): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // 'relative' => the nav bar insets the app instead of drawing over it.
    await NavigationBar.setPositionAsync('relative');
    await NavigationBar.setBackgroundColorAsync(theme.bgElev);
    await NavigationBar.setButtonStyleAsync(theme.mode === 'dark' ? 'light' : 'dark');
  } catch {
    // Best-effort: never let nav-bar styling crash app startup.
  }
}
