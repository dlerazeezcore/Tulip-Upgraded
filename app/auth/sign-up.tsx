import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserPlus, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/state/authStore';
import { AuthShell, AuthSegmented, Field, PasswordField } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';

type Mode = 'password' | 'otp';

export default function SignUp() {
  const t = useTheme();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signUp, requestOtp, verifyOtpAndAuth } = useAuthStore();

  const [mode, setMode] = useState<Mode>('password');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
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
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onPasswordSignUp = () =>
    run(async () => {
      await signUp({ phone, name, password });
      done();
    });

  const onSendCode = () =>
    run(async () => {
      await requestOtp(phone, 'sms');
      setOtpSent(true);
    });

  const onVerify = () =>
    run(async () => {
      await verifyOtpAndAuth({ phone, code, name, channel: 'sms' });
      done();
    });

  return (
    <AuthShell title="Create account" subtitle="Join Tulip — one app for every trip">
      <Field label="Full name" value={name} onChangeText={setName} placeholder="Jane Olsen" />

      <AuthSegmented
        options={[
          { id: 'password', label: 'Password' },
          { id: 'otp', label: 'OTP' },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m as Mode);
          setOtpSent(false);
          setCode('');
          setError(null);
        }}
      />

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Phone number
        </Text>
        <CountryPhoneField onChange={setPhone} />
      </View>

      {mode === 'password' ? (
        <>
          <PasswordField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password (min 8 chars)"
          />
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={busy ? 'Creating…' : 'Create account'}
            icon={<UserPlus size={16} color="#fff" strokeWidth={2.2} />}
            onPress={onPasswordSignUp}
          />
        </>
      ) : !otpSent ? (
        <>
          <Text style={{ fontSize: 12, color: t.fgMuted }}>We'll verify your number with an SMS code.</Text>
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={busy ? 'Sending…' : 'Send code'}
            icon={<MessageCircle size={16} color="#fff" strokeWidth={2.2} />}
            onPress={onSendCode}
          />
        </>
      ) : (
        <>
          <Text style={{ fontSize: 13, color: t.fg }}>Enter the code sent to {phone}</Text>
          <OtpInput value={code} onChange={setCode} />
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton label={busy ? 'Verifying…' : 'Verify & create'} onPress={onVerify} />
          <Pressable onPress={() => setOtpSent(false)} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>Change number</Text>
          </Pressable>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted }}>Already have an account?</Text>
        <Pressable
          onPress={() => router.replace(returnTo ? `/auth/sign-in?returnTo=${returnTo}` : '/auth/sign-in')}
        >
          <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>Sign in</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
