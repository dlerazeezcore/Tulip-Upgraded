import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/state/authStore';
import { AuthShell, Field, PasswordField } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';

type Step = 'phone' | 'otp' | 'reset' | 'done';

export default function Forgot() {
  const t = useTheme();
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

  return (
    <AuthShell title={tr('auth.resetTitle')} subtitle={subtitle}>
      {step === 'phone' && (
        <>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {tr('auth.phoneNumber')}
            </Text>
            <CountryPhoneField onChange={setPhone} autoFocus />
          </View>
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={busy ? tr('auth.sending') : tr('auth.sendResetCode')}
            onPress={() => run(async () => { await requestOtp(phone, 'sms'); setStep('otp'); })}
          />
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={{ fontSize: 13, color: t.fg }}>{tr('auth.enterCodeSentTo', { phone })}</Text>
          <OtpInput value={code} onChange={setCode} />
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={tr('common.continue')}
            onPress={() => {
              if (code.replace(/\D/g, '').length >= 4) setStep('reset');
            }}
          />
          <Pressable onPress={() => setStep('phone')} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.changeNumber')}</Text>
          </Pressable>
        </>
      )}

      {step === 'reset' && (
        <>
          <PasswordField label={tr('auth.newPassword')} value={pw} onChangeText={setPw} placeholder={tr('auth.newPasswordPlaceholder')} />
          <PasswordField label={tr('auth.confirmPassword')} value={pw2} onChangeText={setPw2} placeholder={tr('auth.confirmPasswordPlaceholder')} />
          {pw.length > 0 && pw !== pw2 && (
            <Text style={{ fontSize: 12, color: t.danger }}>{tr('auth.passwordsDontMatch')}</Text>
          )}
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={busy ? tr('auth.resetting') : tr('auth.resetPassword')}
            onPress={() =>
              run(async () => {
                if (pw.length < 8 || pw !== pw2) {
                  setError(tr('auth.passwordRule'));
                  return;
                }
                await resetPassword({ phone, otpCode: code, newPassword: pw, otpChannel: 'sms' });
                setStep('done');
              })
            }
          />
        </>
      )}

      {step === 'done' && (
        <>
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(22,163,74,0.14)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={30} color={t.success} strokeWidth={2.5} />
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
              {tr('auth.passwordResetDone')}
            </Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>
              {tr('auth.signedInNewPassword')}
            </Text>
          </View>
          <PrimaryButton label={tr('common.continue')} onPress={() => router.replace('/(tabs)/profile')} />
        </>
      )}
    </AuthShell>
  );
}
