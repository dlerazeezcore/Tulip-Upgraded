// Auth wiring: phone login (password OR WhatsApp OTP), signup, forgot-password,
// session refresh, profile. OTP delivery is WhatsApp-only via VerifyWay.
import { apiFetch } from '@/lib/api';
import type { AuthMe, AuthSession, OtpSendResult, OtpVerifyResult } from './types';

/** Digit count of the WhatsApp OTP (matches the backend VERIFYWAY_OTP_LENGTH default). */
export const OTP_CODE_LENGTH = 4;

export type PasswordLoginInput = {
  phone: string;
  password: string;
};

/** Password login by phone. */
export function loginWithPassword(input: PasswordLoginInput): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/login', {
    method: 'POST',
    auth: false,
    body: { phone: input.phone, password: input.password },
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
  /** WhatsApp-OTP proof from verifyOtp — signup requires a verified phone. */
  verificationToken: string;
  /** Optional. Sign-up asks for a phone number only; the account starts with no
   *  name (screens fall back to the phone) until it is set in Profile. */
  name?: string;
  /** Optional. An account created without one signs in by WhatsApp code until a
   *  password is set via forgot-password or by an admin. */
  password?: string;
};

export function signup(input: SignupInput): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/signup', {
    method: 'POST',
    auth: false,
    body: input,
  });
}

// ── WhatsApp OTP ───────────────────────────────────────────────────────────

/** Send a WhatsApp OTP; returns the signed challenge to pass back on verify.
 *
 *  TIMEOUT INVARIANT: this must stay ABOVE the backend's own VerifyWay budget
 *  (VERIFYWAY_TIMEOUT_SECONDS, 10s) plus load-balancer slack. The challenge is
 *  minted from this response and stored nowhere else, so if we abort first the
 *  server still finishes the send — the code lands on the user's phone while the
 *  only token that can redeem it is discarded. That was the "OTP arrives but the
 *  screen never changes" bug; the default 20s sat BELOW the old 30s server budget. */
export function sendOtp(phone: string): Promise<OtpSendResult> {
  return apiFetch<OtpSendResult>('/api/v1/otp/send', {
    method: 'POST',
    auth: false,
    body: { phone },
    timeoutMs: 25000,
  });
}

/** Verify a code against its challenge; returns a short-lived verificationToken. */
export function verifyOtp(input: { phone: string; code: string; challenge: string }): Promise<OtpVerifyResult> {
  return apiFetch<OtpVerifyResult>('/api/v1/otp/verify', {
    method: 'POST',
    auth: false,
    body: input,
  });
}

/** Passwordless login for an existing account, proven by a verificationToken. */
export function loginWithOtp(input: { phone: string; verificationToken: string }): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/otp-login', {
    method: 'POST',
    auth: false,
    body: input,
  });
}

/** Set a new password using a verificationToken (forgot-password); auto-logs in. */
export function resetPassword(input: {
  phone: string;
  verificationToken: string;
  newPassword: string;
}): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/reset-password', {
    method: 'POST',
    auth: false,
    body: input,
  });
}

// ── Session ─────────────────────────────────────────────────────────────────

/** Exchange the current bearer for a fresh one (called on app open to roll the
 *  session forward so an active user never hits the token TTL). */
export function refreshSession(): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/refresh', { method: 'POST' });
}

/** End every session for this account, on every device INCLUDING this one.
 *  Ordinary sign-out only drops the local copy of the token; this invalidates the
 *  token itself server-side, which is what a lost or stolen phone needs. */
export function logoutEverywhere(): Promise<unknown> {
  return apiFetch('/api/v1/auth/logout-all', { method: 'POST' });
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
