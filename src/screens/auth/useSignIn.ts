import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { sendOtp, verifyOtp, OTP_CODE_LENGTH } from '@/services/auth';

type Method = 'password' | 'otp';
type OtpStep = 'phone' | 'code';

export function useSignIn() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signInPassword, signInOtp } = useAuthStore();

  const [method, setMethod] = useState<Method>('password');
  const [phone, setPhone] = useState(''); // E.164 from CountryPhoneField
  const [password, setPassword] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
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
      if (!phone) {
        setError(tr('auth.enterPhone'));
        return;
      }
      await signInPassword({ phone, password });
      done();
    });

  const onSendCode = () =>
    run(async () => {
      if (!phone) {
        setError(tr('auth.enterPhone'));
        return;
      }
      const res = await sendOtp(phone);
      setChallenge(res.challenge);
      setCode('');
      setOtpStep('code');
    });

  const onVerifyAndSignIn = () =>
    run(async () => {
      if (!challenge || code.length < OTP_CODE_LENGTH) {
        setError(tr('auth.otpTooShort'));
        return;
      }
      const { verificationToken } = await verifyOtp({ phone, code, challenge });
      await signInOtp({ phone, verificationToken });
      done();
    });

  const onChangeMethod = (v: string) => {
    setMethod(v as Method);
    setError(null);
    setOtpStep('phone');
    setCode('');
  };

  return {
    // state
    method,
    phone,
    password,
    otpStep,
    code,
    busy,
    error,
    // setters used by presentational fields
    setPhone,
    setPassword,
    setCode,
    // handlers
    onChangeMethod,
    onPasswordSignIn,
    onSendCode,
    onVerifyAndSignIn,
    onResend: onSendCode,
    backToPhone: () => {
      setOtpStep('phone');
      setCode('');
      setError(null);
    },
    // navigation
    goForgot: () => router.push('/auth/forgot'),
    goSignUp: () => router.replace(returnTo ? `/auth/sign-up?returnTo=${returnTo}` : '/auth/sign-up'),
  };
}
