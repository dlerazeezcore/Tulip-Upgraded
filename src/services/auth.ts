// Auth wiring: login (phone or email), signup, OTP, password reset, profile.
import { apiFetch, unwrap } from '@/lib/api';
import type { AuthMe, AuthSession, OtpChannel, OtpStartResult } from './types';

export type PasswordLoginInput = {
  phone?: string;
  email?: string;
  password: string;
};

export type OtpLoginInput = {
  phone: string;
  otpCode: string;
  otpChannel?: OtpChannel;
  verificationSid?: string;
};

/** Password login by phone (default) or email (alternative). */
export function loginWithPassword(input: PasswordLoginInput): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/login', {
    method: 'POST',
    auth: false,
    body: { phone: input.phone, email: input.email, password: input.password },
  });
}

/** OTP (SMS/WhatsApp) login for an existing account. */
export function loginWithOtp(input: OtpLoginInput): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/login', {
    method: 'POST',
    auth: false,
    body: {
      phone: input.phone,
      otpCode: input.otpCode,
      otpChannel: input.otpChannel,
      verificationSid: input.verificationSid,
    },
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
  password?: string;
  otpCode?: string;
  otpChannel?: OtpChannel;
  verificationSid?: string;
};

export function signup(input: SignupInput): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/signup', {
    method: 'POST',
    auth: false,
    body: input,
  });
}

export async function requestOtp(phone: string, channel: OtpChannel = 'sms'): Promise<OtpStartResult> {
  const res = await apiFetch('/api/v1/auth/user/otp/request', {
    method: 'POST',
    auth: false,
    body: { phone, channel },
  });
  return unwrap<OtpStartResult>(res);
}

/** Verify an OTP; creates the account on first use and returns a session. */
export function verifyOtp(input: {
  phone: string;
  code: string;
  name?: string;
  channel?: OtpChannel;
  verificationSid?: string;
}): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/otp/verify', {
    method: 'POST',
    auth: false,
    body: input,
  });
}

export function resetPasswordWithOtp(input: {
  phone: string;
  otpCode: string;
  newPassword: string;
  otpChannel?: OtpChannel;
  verificationSid?: string;
}): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/user/password/reset', {
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
