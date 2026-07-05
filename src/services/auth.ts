// Auth wiring: login (phone or email), signup, profile. Password-based.
import { apiFetch } from '@/lib/api';
import type { AuthMe, AuthSession } from './types';

export type PasswordLoginInput = {
  phone?: string;
  email?: string;
  password: string;
};

/** Password login by phone (default) or email (alternative). */
export function loginWithPassword(input: PasswordLoginInput): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/login', {
    method: 'POST',
    auth: false,
    body: { phone: input.phone, email: input.email, password: input.password },
  });
}

export function adminLogin(input: { phone?: string; email?: string; password: string }): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/admin/login', {
    method: 'POST',
    auth: false,
    body: { phone: input.phone, email: input.email, password: input.password },
  });
}

export type SignupInput = {
  phone: string;
  name: string;
  password: string;
};

export function signup(input: SignupInput): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/signup', {
    method: 'POST',
    auth: false,
    body: input,
  });
}

export function fetchMe(): Promise<AuthMe> {
  return apiFetch<AuthMe>('/api/v1/auth/me', { method: 'GET' });
}

export function updateMe(patch: Partial<{
  name: string;
  email: string | null;
  preferredLanguage: string | null;
  preferredCurrency: string | null;
  notificationsEnabled: boolean;
}>): Promise<AuthMe> {
  return apiFetch<AuthMe>('/api/v1/auth/me', { method: 'PATCH', body: patch });
}

export function deleteAccount(): Promise<unknown> {
  return apiFetch('/api/v1/auth/me', { method: 'DELETE' });
}
