import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/state/authStore';
import { AuthShell, Field } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';

type Step = 'phone' | 'otp' | 'reset' | 'done';

export default function Forgot() {
  const t = useTheme();
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
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const subtitle =
    step === 'phone'
      ? 'Enter your phone to receive a reset code'
      : step === 'otp'
        ? 'Enter the code we sent'
        : step === 'reset'
          ? 'Choose a new password'
          : 'All set';

  return (
    <AuthShell title="Reset password" subtitle={subtitle}>
      {step === 'phone' && (
        <>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Phone number
            </Text>
            <CountryPhoneField onChange={setPhone} autoFocus />
          </View>
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={busy ? 'Sending…' : 'Send reset code'}
            onPress={() => run(async () => { await requestOtp(phone, 'sms'); setStep('otp'); })}
          />
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={{ fontSize: 13, color: t.fg }}>Enter the code sent to {phone}</Text>
          <OtpInput value={code} onChange={setCode} />
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label="Continue"
            onPress={() => {
              if (code.replace(/\D/g, '').length >= 4) setStep('reset');
            }}
          />
          <Pressable onPress={() => setStep('phone')} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>Change number</Text>
          </Pressable>
        </>
      )}

      {step === 'reset' && (
        <>
          <Field label="New password" value={pw} onChangeText={setPw} placeholder="New password (min 8 chars)" secureTextEntry />
          <Field label="Confirm password" value={pw2} onChangeText={setPw2} placeholder="Confirm password" secureTextEntry />
          {pw.length > 0 && pw !== pw2 && (
            <Text style={{ fontSize: 12, color: t.danger }}>Passwords don't match</Text>
          )}
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={busy ? 'Resetting…' : 'Reset password'}
            onPress={() =>
              run(async () => {
                if (pw.length < 8 || pw !== pw2) {
                  setError('Password must be at least 8 characters and match.');
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
              Password reset
            </Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>
              You're signed in with your new password.
            </Text>
          </View>
          <PrimaryButton label="Continue" onPress={() => router.replace('/(tabs)/profile')} />
        </>
      )}
    </AuthShell>
  );
}
