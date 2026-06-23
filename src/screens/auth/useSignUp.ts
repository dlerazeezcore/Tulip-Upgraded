import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';

type Mode = 'password' | 'otp';

export function useSignUp() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signUp, requestOtp, verifyOtpAndAuth } = useAuthStore();

  const [mode, setMode] = useState<Mode>('password');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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

  const onPasswordSignUp = () =>
    run(async () => {
      await signUp({ phone, name, password });
      done();
    });

  const onSendCode = () =>
    run(async () => {
      await requestOtp(phone, 'sms');
      setOtpSent(true);
    });

  const onVerify = () =>
    run(async () => {
      await verifyOtpAndAuth({ phone, code, name, channel: 'sms' });
      done();
    });

  const onChangeMode = (m: string) => {
    setMode(m as Mode);
    setOtpSent(false);
    setCode('');
    setError(null);
  };

  return {
    // state
    mode,
    name,
    phone,
    password,
    otpSent,
    code,
    busy,
    error,
    // setters used by presentational fields
    setName,
    setPhone,
    setPassword,
    setCode,
    setOtpSent,
    // segmented handler
    onChangeMode,
    // actions
    onPasswordSignUp,
    onSendCode,
    onVerify,
    // navigation
    goSignIn: () => router.replace(returnTo ? `/auth/sign-in?returnTo=${returnTo}` : '/auth/sign-in'),
  };
}
