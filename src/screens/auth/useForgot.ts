import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { sendOtp, verifyOtp, OTP_CODE_LENGTH } from '@/services/auth';

type Step = 'phone' | 'otp' | 'reset' | 'done';

export function useForgot() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { resetPassword } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const subtitle =
    step === 'phone'
      ? tr('auth.resetPhoneStep')
      : step === 'otp'
        ? tr('auth.resetOtpStep')
        : step === 'reset'
          ? tr('auth.resetResetStep')
          : tr('auth.resetDoneStep');

  const onSendResetCode = () =>
    run(async () => {
      if (!phone) {
        setError(tr('auth.enterPhone'));
        return;
      }
      const res = await sendOtp(phone);
      setChallenge(res.challenge);
      setCode('');
      setStep('otp');
    });

  const onContinueOtp = () =>
    run(async () => {
      if (!challenge || code.length < OTP_CODE_LENGTH) {
        setError(tr('auth.otpTooShort'));
        return;
      }
      const res = await verifyOtp({ phone, code, challenge });
      setVerificationToken(res.verificationToken);
      setStep('reset');
    });

  const onResetPassword = () =>
    run(async () => {
      if (pw.length < 8 || pw !== pw2) {
        setError(tr('auth.passwordRule'));
        return;
      }
      if (!verificationToken) {
        setError(tr('common.somethingWrong'));
        return;
      }
      // Succeeds → the store sets the session, so the user lands signed in.
      await resetPassword({ phone, verificationToken, newPassword: pw });
      setStep('done');
    });

  return {
    // state
    step,
    phone,
    code,
    pw,
    pw2,
    busy,
    error,
    // derived
    subtitle,
    // setters
    setPhone,
    setCode,
    setPw,
    setPw2,
    // step navigation
    backToPhone: () => {
      setStep('phone');
      setCode('');
      setError(null);
    },
    // actions
    onSendResetCode,
    onContinueOtp,
    onResend: onSendResetCode,
    onResetPassword,
    // navigation
    goProfile: () => router.replace('/(tabs)/profile'),
  };
}
