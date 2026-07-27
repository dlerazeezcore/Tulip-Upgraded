// Is the on-screen keyboard up right now?
//
// Used to collapse tall decorative headers while someone is typing. On a small
// phone the keyboard can take half the screen, so a 190px hero that never shrinks
// pushes the actual form (and its submit button) out of view.
//
// Lives here alongside useIsWideWeb — same idea, a small layout-environment hook.
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Web has no software keyboard that steals layout space — the browser scrolls
    // the focused field into view itself — so this stays false there.
    if (Platform.OS === 'web') return;

    // iOS emits will* alongside the keyboard's own animation, so the layout
    // collapses in step with it rather than snapping afterwards. Android only
    // emits did* reliably.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}
