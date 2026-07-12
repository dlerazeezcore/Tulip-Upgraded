import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { sendOtp, verifyOtp, OTP_CODE_LENGTH } from '@/services/auth';

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

  // Step 1: validate the details, then send the WhatsApp code to verify the phone.
  const onContinue = () =>
    run(async () => {
      if (name.trim().length < 2) {
        setError(tr('auth.nameTooShort'));
        return;
      }
      if (!phone) {
        setError(tr('auth.enterPhone'));
        return;
      }
      if (password.length < 8) {
        setError(tr('auth.passwordRule'));
        return;
      }
      const res = await sendOtp(phone);
      setChallenge(res.challenge);
      setCode('');
      setStep('code');
    });

  // Step 2: verify the code, then create the account with the verification proof.
  const onVerifyAndCreate = () =>
    run(async () => {
      if (!challenge || code.length < OTP_CODE_LENGTH) {
        setError(tr('auth.otpTooShort'));
        return;
      }
      const { verificationToken } = await verifyOtp({ phone, code, challenge });
      await signUp({ phone, name: name.trim(), password, verificationToken });
      done();
    });

  return {
    // state
    step,
    name,
    phone,
    password,
    code,
    busy,
    error,
    // setters used by presentational fields
    setName,
    setPhone,
    setPassword,
    setCode,
    // handlers
    onContinue,
    onVerifyAndCreate,
    onResend: onContinue,
    backToDetails: () => {
      setStep('details');
      setCode('');
      setError(null);
    },
    // navigation
    goSignIn: () => router.replace(returnTo ? `/auth/sign-in?returnTo=${returnTo}` : '/auth/sign-in'),
  };
}
