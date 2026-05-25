import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthUser = {
  id: string;
  name: string;
  phone: string; // full, e.g. +9647501234567
  email?: string;
  initials: string;
  isAdmin?: boolean;
};

// Mock admin accounts — in production this comes from the backend/role claim.
const ADMIN_IDENTIFIERS = ['admin@tulip.app', '+9647500000000', '7500000000'];
function isAdminIdentifier(...values: (string | null | undefined)[]): boolean {
  return values.some((v) => v && ADMIN_IDENTIFIERS.includes(v.trim().toLowerCase()));
}

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  /** phone captured during a WhatsApp/OTP/reset flow */
  pendingPhone: string | null;
  isAuthed: () => boolean;
  hydrate: () => Promise<void>;
  signInPassword: (identifier: string, _password: string) => void;
  signUp: (name: string, phone: string, email?: string) => void;
  startPhoneFlow: (phone: string) => void;
  /** any non-trivial code is accepted (mock) */
  verifyOtp: (code: string, fallbackName?: string) => boolean;
  signOut: () => void;
};

const KEY = 'tulip.auth';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function persist(user: AuthUser | null) {
  if (user) AsyncStorage.setItem(KEY, JSON.stringify(user)).catch(() => {});
  else AsyncStorage.removeItem(KEY).catch(() => {});
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  pendingPhone: null,
  isAuthed: () => get().user !== null,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ user: JSON.parse(raw) });
    } catch {}
    set({ hydrated: true });
  },
  signInPassword: (identifier) => {
    // Mock: derive a friendly name; treat phone-like identifiers as phone.
    const looksPhone = /^[+\d][\d\s]+$/.test(identifier);
    const admin = isAdminIdentifier(identifier);
    const user: AuthUser = {
      id: 'u_' + Date.now(),
      name: admin ? 'Tulip Admin' : 'Jane Olsen',
      phone: looksPhone ? identifier : '+9647501234567',
      email: looksPhone ? undefined : identifier,
      initials: admin ? 'TA' : 'JO',
      isAdmin: admin,
    };
    set({ user });
    persist(user);
  },
  signUp: (name, phone, email) => {
    const admin = isAdminIdentifier(phone, email);
    const user: AuthUser = {
      id: 'u_' + Date.now(),
      name: name || 'New Traveler',
      phone,
      email,
      initials: initials(name || 'New Traveler'),
      isAdmin: admin,
    };
    set({ user });
    persist(user);
  },
  startPhoneFlow: (phone) => set({ pendingPhone: phone }),
  verifyOtp: (code, fallbackName) => {
    if (!code || code.replace(/\D/g, '').length < 4) return false;
    const phone = get().pendingPhone ?? '+9647501234567';
    const admin = isAdminIdentifier(phone);
    const name = fallbackName || (admin ? 'Tulip Admin' : 'Jane Olsen');
    const user: AuthUser = {
      id: 'u_' + Date.now(),
      name,
      phone,
      initials: initials(name),
      isAdmin: admin,
    };
    set({ user, pendingPhone: null });
    persist(user);
    return true;
  },
  signOut: () => {
    set({ user: null, pendingPhone: null });
    persist(null);
  },
}));
