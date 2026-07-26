import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { authErrorMessage } from '@/lib/authErrors';
import { useOtpChallenge } from '@/screens/auth/useOtpChallenge';

type Step = 'details' | 'code';

export function useSignUp() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signUp } = useAuthStore();

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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

  const validateDetails = (): boolean => {
    if (name.trim().length < 2) {
      setError(tr('auth.nameTooShort'));
      return false;
    }
    if (!phone) {
      setError(tr('auth.enterPhone'));
      return false;
    }
    if (password.length < 8) {
      setError(tr('auth.passwordRule'));
      return false;
    }
    return true;
  };

  // Step 1: validate the details, then send the WhatsApp code to verify the phone.
  const onContinue = () =>
    run(async () => {
      if (!validateDetails()) return;
      if (await otp.send(phone)) setStep('code');
    });

  // Resending from the code step must not re-run details validation against state
  // the user can no longer see — it only needs another code for the same phone.
  const onResend = () =>
    run(async () => {
      await otp.send(phone);
    });

  // Step 2: verify the code, then create the account with the verification proof.
  const onVerifyAndCreate = () =>
    run(async () => {
      if (!otp.codeComplete) {
        setError(tr('auth.otpTooShort'));
        return;
      }
      const verificationToken = await otp.verify(phone);
      await signUp({ phone, name: name.trim(), password, verificationToken });
      done();
    });

  return {
    // state
    step,
    name,
    phone,
    password,
    code: otp.code,
    busy,
    error,
    // OTP affordances
    maybeSent: otp.maybeSent,
    resendIn: otp.resendIn,
    expiresIn: otp.expiresIn,
    canResend: otp.resendIn === 0 && !busy,
    // setters used by presentational fields
    setName,
    setPhone,
    setPassword,
    setCode: otp.setCode,
    // handlers
    onContinue,
    onVerifyAndCreate,
    onResend,
    backToDetails: () => {
      if (busy) return;
      setStep('details');
      otp.reset();
      setError(null);
    },
    // navigation
    goSignIn: () => router.replace(returnTo ? `/auth/sign-in?returnTo=${returnTo}` : '/auth/sign-in'),
  };
}
