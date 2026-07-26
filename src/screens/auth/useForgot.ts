import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { ApiError } from '@/lib/api';
import { authErrorMessage } from '@/lib/authErrors';
import { useOtpChallenge } from '@/screens/auth/useOtpChallenge';

type Step = 'phone' | 'otp' | 'reset' | 'done';

export function useForgot() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { resetPassword } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otp = useOtpChallenge();

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

  const subtitle =
    step === 'phone'
      ? tr('auth.resetPhoneStep')
      : step === 'otp'
        ? tr('auth.resetOtpStep')
        : step === 'reset'
          ? tr('auth.resetResetStep')
          : tr('auth.resetDoneStep');

  /** Back to the very start, discarding the proof — also the recovery path when the
   *  verification token expires under the user on the 'reset' step. */
  const startOver = (message?: string) => {
    setStep('phone');
    setVerificationToken(null);
    setPw('');
    setPw2('');
    otp.reset();
    setError(message ?? null);
  };

  const onSendResetCode = () =>
    run(async () => {
      if (!phone) {
        setError(tr('auth.enterPhone'));
        return;
      }
      if (await otp.send(phone)) setStep('otp');
    });

  const onContinueOtp = () =>
    run(async () => {
      if (!otp.codeComplete) {
        setError(tr('auth.otpTooShort'));
        return;
      }
      setVerificationToken(await otp.verify(phone));
      setStep('reset');
    });

  const onResetPassword = () =>
    run(async () => {
      if (pw.length < 8) {
        setError(tr('auth.passwordRule'));
        return;
      }
      if (pw !== pw2) {
        setError(tr('auth.passwordsDontMatch'));
        return;
      }
      if (!verificationToken) {
        startOver(tr('auth.errors.challengeMissing'));
        return;
      }
      try {
        // Succeeds → the store sets the session, so the user lands signed in.
        await resetPassword({ phone, verificationToken, newPassword: pw });
      } catch (e) {
        // The proof is only valid for a few minutes. If it lapsed while the user was
        // choosing a password, this step had no way out — send them back to the
        // start with an explanation rather than leaving them stuck on a dead form.
        if (e instanceof ApiError && (e.status === 400 || e.code === 'AUTH_OTP_INVALID')) {
          startOver(tr('auth.errors.proofExpired'));
          return;
        }
        throw e;
      }
      setStep('done');
    });

  return {
    // state
    step,
    phone,
    code: otp.code,
    pw,
    pw2,
    busy,
    error,
    // derived
    subtitle,
    // OTP affordances
    maybeSent: otp.maybeSent,
    resendIn: otp.resendIn,
    expiresIn: otp.expiresIn,
    canResend: otp.resendIn === 0 && !busy,
    // setters
    setPhone,
    setCode: otp.setCode,
    setPw,
    setPw2,
    // step navigation
    backToPhone: () => {
      if (busy) return;
      startOver();
    },
    startOver: () => {
      if (busy) return;
      startOver();
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
