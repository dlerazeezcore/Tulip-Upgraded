// Push notification wiring: permission, FCM device token, register/unregister with backend.
//
// The backend uses Firebase Admin SDK directly (NOT Expo's push service), so the
// device must hand it a Firebase FCM **registration token**. We use
// `@react-native-firebase/messaging` for token retrieval because:
//   - Android: messaging().getToken() returns an FCM token natively.
//   - iOS: messaging().getToken() asks Firebase iOS SDK to register with APNs and
//     return an FCM token. (Plain expo-notifications gives the raw APNs token on
//     iOS, which firebase-admin's send_each_for_multicast refuses.)
// expo-notifications still owns the foreground notification handler and permission
// prompt; rn-firebase owns the token retrieval. The two coexist cleanly.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { apiFetch } from '@/lib/api';

// @react-native-firebase/messaging has no web implementation — a static import
// crashes the web bundle at module load (= white screen on tulipbookings.com).
// Resolve it lazily and only on native, so Metro's web bundle never executes it.
type FirebaseMessagingModule = () => {
  registerDeviceForRemoteMessages: () => Promise<void>;
  getToken: () => Promise<string>;
};
let firebaseMessaging: FirebaseMessagingModule | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    firebaseMessaging = require('@react-native-firebase/messaging').default as FirebaseMessagingModule;
  } catch {
    firebaseMessaging = null;
  }
}

type RegisterPayload = {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string | null;
  appVersion?: string | null;
  locale?: string | null;
  timezone?: string | null;
};

let lastRegisteredToken: string | null = null;

/** Ask for notification permission. Returns true if granted. Web/Simulator → false. */
export async function ensurePushPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false; // simulators/emulators can't get real push tokens
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain === false) return false;
    const next = await Notifications.requestPermissionsAsync();
    return !!next.granted;
  } catch {
    return false;
  }
}

/** Get an FCM registration token (both platforms), or null on failure / web. */
export async function getFcmDeviceToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !firebaseMessaging) return null;
  try {
    // iOS must register for remote messages before the FCM token is available.
    // No-op on Android. Safe to call repeatedly.
    if (Platform.OS === 'ios') {
      await firebaseMessaging().registerDeviceForRemoteMessages();
    }
    const token = await firebaseMessaging().getToken();
    return (token || '').trim() || null;
  } catch {
    return null;
  }
}

function platformName(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

async function resolveDeviceId(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') return Application.getAndroidId() ?? null;
    if (Platform.OS === 'ios') return (await Application.getIosIdForVendorAsync()) ?? null;
  } catch {}
  return null;
}

/** Register or refresh the current device with the backend. Idempotent (server upserts by token). */
export async function registerDevice(opts: { locale?: string | null } = {}): Promise<string | null> {
  const granted = await ensurePushPermission();
  if (!granted) return null;
  const token = await getFcmDeviceToken();
  if (!token) return null;
  const deviceId = await resolveDeviceId();
  const tz = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || null;
  const body: RegisterPayload = {
    token,
    platform: platformName(),
    deviceId,
    appVersion: Constants.expoConfig?.version || Application.nativeApplicationVersion || null,
    locale: opts.locale ?? null,
    timezone: tz,
  };
  try {
    await apiFetch('/api/v1/push-notifications/devices/register', {
      method: 'POST',
      body,
    });
    lastRegisteredToken = token;
    return token;
  } catch {
    return null;
  }
}

/** Deactivate the current device's push registration on the backend. Safe to call when not authed. */
export async function unregisterDevice(): Promise<void> {
  const token = lastRegisteredToken || (await getFcmDeviceToken());
  if (!token) return;
  try {
    await apiFetch('/api/v1/push-notifications/devices/unregister', {
      method: 'POST',
      body: { token },
    });
  } catch {
    // swallow — best-effort cleanup
  } finally {
    lastRegisteredToken = null;
  }
}

/** Module-load: set how foreground notifications appear (banner + sound, no badge). */
export function configureNotificationHandler(): void {
  if (Platform.OS === 'web') return; // no notification surface on web; expo-notifications shim varies
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Defensive: never let notification setup blank-screen the app
  }
}
