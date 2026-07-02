import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';

type Mode = 'password' | 'otp';
type Identifier = 'phone' | 'email';

export function useSignIn() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signInPassword, signInOtp, requestOtp } = useAuthStore();

  const [mode, setMode] = useState<Mode>('password');
  const [identifier, setIdentifier] = useState<Identifier>('phone');
  const [phone, setPhone] = useState(''); // E.164 from CountryPhoneField
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = () => {
    if (returnTo === 'checkout') router.replace('/esim-store/checkout');
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message || tr('common.somethingWrong'));
    } finally {
      setBusy(false);
    }
  };

  const onPasswordSignIn = () =>
    run(async () => {
      if (identifier === 'email') await signInPassword({ email: email.trim(), password });
      else await signInPassword({ phone, password });
      done();
    });

  const onSendCode = () =>
    run(async () => {
      // OTP is SMS-only — never fire the request with an empty phone (e.g.
      // when the identifier toggle sits on email).
      const trimmed = phone.trim();
      if (!trimmed) throw new Error(tr('auth.phoneRequired'));
      await requestOtp(trimmed, 'sms');
      setOtpSent(true);
    });

  const onVerify = () =>
    run(async () => {
      await signInOtp({ phone, otpCode: code, otpChannel: 'sms' });
      done();
    });

  const onChangeMode = (m: string) => {
    setMode(m as Mode);
    setOtpSent(false);
    setCode('');
    setError(null);
  };

  const onChangeIdentifier = (v: string) => {
    setIdentifier(v as Identifier);
    setError(null);
  };

  return {
    // state
    mode,
    identifier,
    phone,
    email,
    password,
    otpSent,
    code,
    busy,
    error,
    // setters used by presentational fields
    setPhone,
    setEmail,
    setPassword,
    setCode,
    setOtpSent,
    // segmented handlers
    onChangeMode,
    onChangeIdentifier,
    // actions
    onPasswordSignIn,
    onSendCode,
    onVerify,
    // navigation
    goForgot: () => router.push('/auth/forgot'),
    goSignUp: () => router.replace(returnTo ? `/auth/sign-up?returnTo=${returnTo}` : '/auth/sign-up'),
  };
}
