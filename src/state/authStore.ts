import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '@/lib/api';
import * as authApi from '@/services/auth';
import type { AuthSession, AuthMe, OtpChannel } from '@/services/types';

export type AuthUser = {
  id: string;
  name: string;
  phone: string; // full E.164, e.g. +9647501234567
  email?: string;
  initials: string;
  isAdmin?: boolean;
  subjectType?: 'user' | 'admin';
};

const USER_KEY = 'tulip.auth';
const TOKEN_KEY = 'tulip.auth.token';

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
    subjectType: m.subjectType,
  };
}

function persist(user: AuthUser | null, token: string | null) {
  if (user) AsyncStorage.setItem(USER_KEY, JSON.stringify(user)).catch(() => {});
  else AsyncStorage.removeItem(USER_KEY).catch(() => {});
  if (token) AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {});
  else AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
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
        AsyncStorage.getItem(TOKEN_KEY),
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

  startPhoneFlow: (phone) => set({ pendingPhone: phone }),

  signOut: () => {
    setAuthToken(null);
    set({ user: null, token: null, pendingPhone: null });
    persist(null, null);
  },
}));
