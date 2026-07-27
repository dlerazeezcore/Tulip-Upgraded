import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { authErrorMessage } from '@/lib/authErrors';
import { useOtpAutoSubmit, useOtpChallenge } from '@/screens/auth/useOtpChallenge';

type Step = 'phone' | 'code';

/**
 * Sign-up asks for a phone number and nothing else.
 *
 * No name and no password: the account is created with an empty name (screens show
 * the phone number until the user sets one in Profile) and no password (they sign
 * in by WhatsApp code until one is set via forgot-password or by an admin).
 */
export function useSignUp() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signUp } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
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

  const onContinue = () =>
    run(async () => {
      if (!phone) {
        setError(tr('auth.enterPhone'));
        return;
      }
      if (await otp.send(phone)) setStep('code');
    });

  // Verifies by itself once the last digit is typed.
  const onVerifyAndCreate = () =>
    run(async () => {
      if (!otp.codeComplete) {
        setError(tr('auth.otpTooShort'));
        return;
      }
      try {
        const verificationToken = await otp.verify(phone);
        await signUp({ phone, verificationToken });
      } catch (e) {
        otp.noteVerifyFailure(e);
        throw e;
      }
      done();
    });

  useOtpAutoSubmit({ code: otp.code, busy, onSubmit: onVerifyAndCreate });

  return {
    // state
    step,
    phone,
    code: otp.code,
    busy,
    error,
    // OTP affordances
    maybeSent: otp.maybeSent,
    resendIn: otp.resendIn,
    expiresIn: otp.expiresIn,
    canResend: otp.resendIn === 0 && !busy,
    canRetry: otp.canRetry,
    focusSignal: otp.focusSignal,
    // setters used by presentational fields
    setPhone,
    setCode: otp.setCode,
    // handlers
    onContinue,
    onVerifyAndCreate,
    onRetryVerify: onVerifyAndCreate,
    onResend: onContinue,
    backToPhone: () => {
      if (busy) return;
      setStep('phone');
      otp.reset();
      setError(null);
    },
    // navigation
    goSignIn: () => router.replace(returnTo ? `/auth/sign-in?returnTo=${returnTo}` : '/auth/sign-in'),
  };
}
