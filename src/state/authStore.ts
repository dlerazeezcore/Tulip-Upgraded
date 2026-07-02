import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '@/lib/api';
import * as authApi from '@/services/auth';
import { registerDevice, unregisterDevice } from '@/services/push';
import { getLocaleLanguage, registerAuthAccessor } from '@/state/storeAccess';
import type { AuthSession, AuthMe, OtpChannel } from '@/services/types';

export type AuthUser = {
  id: string;
  name: string;
  phone: string; // full E.164, e.g. +9647501234567
  email?: string;
  initials: string;
  isAdmin?: boolean;
  isLoyalty?: boolean;
  createdAt?: string | null;
  subjectType?: 'user' | 'admin';
  notificationsEnabled?: boolean;
};

const USER_KEY = 'tulip.auth';
const TOKEN_KEY = 'tulip.auth.token';

// --- Token storage adapter --------------------------------------------------
// The bearer token is sensitive, so on native it lives in the platform
// keychain/keystore via expo-secure-store. SecureStore is unavailable on web,
// where we keep using AsyncStorage. The non-sensitive USER_KEY profile blob
// stays in AsyncStorage on all platforms.
const isWeb = Platform.OS === 'web';

const tokenStorage = {
  async get(): Promise<string | null> {
    if (isWeb) return AsyncStorage.getItem(TOKEN_KEY);
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token !== null) return token;
    // One-time migration: older builds persisted the token in AsyncStorage.
    // Adopt it into SecureStore so already-signed-in users stay signed in,
    // then drop the plaintext copy.
    const legacy = await AsyncStorage.getItem(TOKEN_KEY);
    if (legacy) {
      await SecureStore.setItemAsync(TOKEN_KEY, legacy);
      AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
    }
    return legacy;
  },
  set(token: string): Promise<void> {
    if (isWeb) return AsyncStorage.setItem(TOKEN_KEY, token);
    return SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async remove(): Promise<void> {
    // Belt and braces: clear both stores so no plaintext copy lingers.
    await Promise.all([
      isWeb ? Promise.resolve() : SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
      AsyncStorage.removeItem(TOKEN_KEY).catch(() => {}),
    ]);
  },
};

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function userFromSession(s: AuthSession): AuthUser {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email ?? undefined,
    initials: initials(s.name),
    isAdmin: !!s.isAdmin,
    isLoyalty: !!s.isLoyalty,
    createdAt: s.createdAt ?? null,
    subjectType: s.subjectType,
  };
}

function userFromMe(m: AuthMe): AuthUser {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    email: m.email ?? undefined,
    initials: initials(m.name),
    isAdmin: m.subjectType === 'admin',
    isLoyalty: !!m.isLoyalty,
    createdAt: m.createdAt ?? null,
    subjectType: m.subjectType,
    notificationsEnabled: m.notificationsEnabled !== false, // default ON when undefined
  };
}

function persist(user: AuthUser | null, token: string | null) {
  if (user) AsyncStorage.setItem(USER_KEY, JSON.stringify(user)).catch(() => {});
  else AsyncStorage.removeItem(USER_KEY).catch(() => {});
  if (token) tokenStorage.set(token).catch(() => {});
  else tokenStorage.remove().catch(() => {});
}

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  pendingPhone: string | null;
  isAuthed: () => boolean;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession) => AuthUser;
  signInPassword: (input: { phone?: string; email?: string; password: string }) => Promise<AuthUser>;
  signInOtp: (input: { phone: string; otpCode: string; otpChannel?: OtpChannel; verificationSid?: string }) => Promise<AuthUser>;
  signUp: (input: authApi.SignupInput) => Promise<AuthUser>;
  requestOtp: (phone: string, channel?: OtpChannel) => Promise<void>;
  verifyOtpAndAuth: (input: { phone: string; code: string; name?: string; channel?: OtpChannel; verificationSid?: string }) => Promise<AuthUser>;
  resetPassword: (input: { phone: string; otpCode: string; newPassword: string; otpChannel?: OtpChannel; verificationSid?: string }) => Promise<AuthUser>;
  updateProfile: (patch: { name?: string; email?: string | null; notificationsEnabled?: boolean }) => Promise<AuthUser>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  deleteAccount: () => Promise<void>;
  startPhoneFlow: (phone: string) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  pendingPhone: null,
  isAuthed: () => get().user !== null,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [token, rawUser] = await Promise.all([
        tokenStorage.get(),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (token) {
        setAuthToken(token);
        // Show cached user immediately, then refresh from the server.
        if (rawUser) set({ user: JSON.parse(rawUser), token });
        else set({ token });
        try {
          const me = await authApi.fetchMe();
          const user = userFromMe(me);
          set({ user });
          persist(user, token);
          // Re-register the device on every successful hydration. This catches
          // the upgrade case where a user was already signed in on an older build
          // (so setSession never fires this time) and means we'll surface iOS'
          // push-permission prompt on first launch of a build that has the
          // notifications module — even if the user never signs out + back in.
          // Idempotent: registerDevice silently no-ops if permission was denied.
          try {
            registerDevice({ locale: getLocaleLanguage() }).catch(() => {});
          } catch {
            // ignore
          }
        } catch {
          // token invalid/expired → clear session
          setAuthToken(null);
          set({ user: null, token: null });
          persist(null, null);
        }
      }
    } catch {
      // ignore storage errors
    }
    set({ hydrated: true });
  },

  setSession: (session) => {
    const user = userFromSession(session);
    setAuthToken(session.accessToken);
    set({ user, token: session.accessToken, pendingPhone: null });
    persist(user, session.accessToken);
    // Fire-and-forget: register this device's push token + locale with the backend.
    // Locale is read lazily via storeAccess to avoid a require cycle.
    try {
      registerDevice({ locale: getLocaleLanguage() }).catch(() => {});
    } catch {
      // ignore — push registration must not block login UX
    }
    return user;
  },

  signInPassword: async (input) => get().setSession(await authApi.loginWithPassword(input)),
  signInOtp: async (input) => get().setSession(await authApi.loginWithOtp(input)),
  signUp: async (input) => get().setSession(await authApi.signup(input)),
  verifyOtpAndAuth: async (input) => get().setSession(await authApi.verifyOtp(input)),
  resetPassword: async (input) => get().setSession(await authApi.resetPasswordWithOtp(input)),

  requestOtp: async (phone, channel = 'sms') => {
    await authApi.requestOtp(phone, channel);
    set({ pendingPhone: phone });
  },

  updateProfile: async (patch) => {
    const me = await authApi.updateMe(patch);
    const user = userFromMe(me);
    set({ user });
    persist(user, get().token);
    return user;
  },

  // Optimistic toggle for the profile Notifications switch. Reverts on failure.
  setNotificationsEnabled: async (enabled) => {
    const prev = get().user;
    if (!prev) return;
    const optimistic = { ...prev, notificationsEnabled: enabled };
    set({ user: optimistic });
    persist(optimistic, get().token);
    try {
      const me = await authApi.updateMe({ notificationsEnabled: enabled });
      const user = userFromMe(me);
      set({ user });
      persist(user, get().token);
    } catch {
      // Revert
      set({ user: prev });
      persist(prev, get().token);
      throw new Error('Could not update notification preference');
    }
  },

  deleteAccount: async () => {
    try {
      await authApi.deleteAccount();
    } finally {
      get().signOut();
    }
  },

  startPhoneFlow: (phone) => set({ pendingPhone: phone }),

  signOut: () => {
    // Fire-and-forget device unregistration before we drop the token (the request
    // needs the bearer to identify the actor). Failure must not block sign-out.
    unregisterDevice().catch(() => {});
    setAuthToken(null);
    set({ user: null, token: null, pendingPhone: null });
    persist(null, null);
  },
}));

// Publish this store to the cycle-breaking accessor so localeStore can read it
// without a static import (and the corresponding require cycle).
registerAuthAccessor(useAuthStore);
