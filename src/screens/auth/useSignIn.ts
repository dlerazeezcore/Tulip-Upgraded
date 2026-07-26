import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { authErrorMessage } from '@/lib/authErrors';
import { useOtpChallenge } from '@/screens/auth/useOtpChallenge';

type Method = 'otp' | 'password';
type OtpStep = 'phone' | 'code';

export function useSignIn() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signInPassword, signInOtp } = useAuthStore();

  // WhatsApp code is the primary way in: it is the only method every account has
  // (a password is optional), and it needs no remembered secret. The password tab
  // stays one tap away for anyone who prefers it.
  const [method, setMethod] = useState<Method>('otp');
  const [phone, setPhone] = useState(''); // E.164 from CountryPhoneField
  const [password, setPassword] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otp = useOtpChallenge();

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
    } catch (e) {
      setError(authErrorMessage(e, tr));
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
      if (!password) {
        setError(tr('auth.enterPassword'));
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
      // Advances even when the response was lost in transit — the code has very
      // likely been delivered, and leaving the user on the phone field with no way
      // forward was the original bug. otp.maybeSent drives the explanatory copy.
      if (await otp.send(phone)) setOtpStep('code');
    });

  const onVerifyAndSignIn = () =>
    run(async () => {
      if (!otp.codeComplete) {
        setError(tr('auth.otpTooShort'));
        return;
      }
      const verificationToken = await otp.verify(phone);
      await signInOtp({ phone, verificationToken });
      done();
    });

  const onChangeMethod = (v: string) => {
    setMethod(v as Method);
    setError(null);
    setOtpStep('phone');
    otp.reset();
  };

  return {
    // state
    method,
    phone,
    password,
    otpStep,
    code: otp.code,
    busy,
    error,
    // OTP affordances
    maybeSent: otp.maybeSent,
    resendIn: otp.resendIn,
    expiresIn: otp.expiresIn,
    canResend: otp.resendIn === 0 && !busy,
    // setters used by presentational fields
    setPhone,
    setPassword,
    setCode: otp.setCode,
    // handlers
    onChangeMethod,
    onPasswordSignIn,
    onSendCode,
    onVerifyAndSignIn,
    onResend: onSendCode,
    backToPhone: () => {
      if (busy) return; // an in-flight verify must not resolve onto a dead step
      setOtpStep('phone');
      otp.reset();
      setError(null);
    },
    // navigation
    goForgot: () => router.push('/auth/forgot'),
    goSignUp: () => router.replace(returnTo ? `/auth/sign-up?returnTo=${returnTo}` : '/auth/sign-up'),
  };
}
