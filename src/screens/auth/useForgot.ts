import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';

type Step = 'phone' | 'otp' | 'reset' | 'done';

export function useForgot() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { requestOtp, resetPassword } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
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
      await requestOtp(phone, 'sms');
      setStep('otp');
    });

  const onContinueOtp = () => {
    if (code.replace(/\D/g, '').length >= 4) setStep('reset');
  };

  const onResetPassword = () =>
    run(async () => {
      if (pw.length < 8 || pw !== pw2) {
        setError(tr('auth.passwordRule'));
        return;
      }
      await resetPassword({ phone, otpCode: code, newPassword: pw, otpChannel: 'sms' });
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
    // setters used by presentational fields
    setPhone,
    setCode,
    setPw,
    setPw2,
    // step navigation
    backToPhone: () => setStep('phone'),
    // actions
    onSendResetCode,
    onContinueOtp,
    onResetPassword,
    // navigation
    goProfile: () => router.replace('/(tabs)/profile'),
  };
}
