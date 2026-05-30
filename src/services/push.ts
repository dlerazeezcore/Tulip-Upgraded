// Push notification wiring: permission, FCM device token, register/unregister with backend.
//
// The backend uses Firebase Admin SDK directly (NOT Expo's push service), so we use
// `Notifications.getDevicePushTokenAsync()` to get the native FCM (Android) / APNs (iOS)
// token. The backend's firebase-admin handles both. Do NOT swap to
// `getExpoPushTokenAsync()` — the backend won't deliver to Expo tokens.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { apiFetch } from '@/lib/api';

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

/** Get the FCM (Android) / APNs (iOS) device token, or null on failure / web. */
export async function getFcmDeviceToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const result = await Notifications.getDevicePushTokenAsync();
    const value = String(result?.data || '').trim();
    return value || null;
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
    if (Platform.OS === 'android') return Application.androidId ?? null;
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
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
