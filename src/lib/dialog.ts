// Cross-platform confirm / notify.
//
// WHY THIS EXISTS: react-native-web ships Alert as a literal no-op —
//   class Alert { static alert() {} }
// so every `Alert.alert(...)` in the app does NOTHING on web. No dialog, no
// callback, no error. Any action gated behind a confirmation simply appeared
// dead: the admin push-notification screens looked like the Send button was
// broken, because the confirm step never rendered and its onPress never ran.
// Informational alerts were invisible for the same reason, so failures were
// silently swallowed.
//
// These helpers keep the native dialogs exactly as they were and fall back to the
// browser's own dialogs on web. The browser ones are plain, but a plain dialog
// that works beats a beautiful one that does not.
import { Alert, Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export type ConfirmOptions = {
  title: string;
  message?: string;
  /** Label for the confirming button (defaults to a generic OK upstream). */
  confirmLabel: string;
  cancelLabel: string;
  /** Renders the confirm button in the destructive style on native. */
  destructive?: boolean;
};

/**
 * Ask the user to confirm. Resolves true when they accept, false otherwise.
 *
 * Await it instead of passing an onPress callback — that pattern is what broke on
 * web, and a promise keeps the call site readable:
 *
 *   if (!(await confirmAction({...}))) return;
 *   await doTheThing();
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
}: ConfirmOptions): Promise<boolean> {
  if (isWeb) {
    // window.confirm takes a single string and its own OK/Cancel labels, so fold
    // the title and message together and drop our labels.
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(text) : false);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

/** Show a message with a single acknowledgement. Works on web, unlike Alert.alert. */
export function notify(title: string, message?: string): void {
  if (isWeb) {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== 'undefined') window.alert(text);
    return;
  }
  Alert.alert(title, message);
}
