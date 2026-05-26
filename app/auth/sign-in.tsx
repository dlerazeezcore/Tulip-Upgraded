import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LogIn, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/state/authStore';
import { AuthShell, AuthSegmented, Field } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';

type Mode = 'password' | 'otp';
type Identifier = 'phone' | 'email';

export default function SignIn() {
  const t = useTheme();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signInPassword, signInOtp, requestOtp } = useAuthStore();

  const [mode, setMode] = useState<Mode>('password');
  const [identifier, setIdentifier] = useState<Identifier>('phone');
  const [phone, setPhone] = useState(''); // E.164 from CountryPhoneField
  const [email, setEmail] = useState('');
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

  const onPasswordSignIn = () =>
    run(async () => {
      if (identifier === 'email') await signInPassword({ email: email.trim(), password });
      else await signInPassword({ phone, password });
      done();
    });

  const onSendCode = () =>
    run(async () => {
      await requestOtp(phone, 'sms');
      setOtpSent(true);
    });

  const onVerify = () =>
    run(async () => {
      await signInOtp({ phone, otpCode: code, otpChannel: 'sms' });
      done();
    });

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your journey">
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

      {mode === 'password' ? (
        <>
          <AuthSegmented
            options={[
              { id: 'phone', label: 'Phone' },
              { id: 'email', label: 'Email' },
            ]}
            value={identifier}
            onChange={(v) => {
              setIdentifier(v as Identifier);
              setError(null);
            }}
          />
          {identifier === 'phone' ? (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Phone number
              </Text>
              <CountryPhoneField onChange={setPhone} />
            </View>
          ) : (
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          )}
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <Pressable onPress={() => router.push('/auth/forgot')} style={{ alignSelf: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: t.primary, fontWeight: '700' }}>Forgot password?</Text>
          </Pressable>
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={busy ? 'Signing in…' : 'Sign in'}
            icon={<LogIn size={16} color="#fff" strokeWidth={2.2} />}
            onPress={onPasswordSignIn}
          />
        </>
      ) : !otpSent ? (
        <>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Phone number
            </Text>
            <CountryPhoneField onChange={setPhone} />
          </View>
          <Text style={{ fontSize: 12, color: t.fgMuted }}>We'll send a one-time code by SMS.</Text>
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
          <PrimaryButton label={busy ? 'Verifying…' : 'Verify & sign in'} onPress={onVerify} />
          <Pressable onPress={() => setOtpSent(false)} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>Change number</Text>
          </Pressable>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted }}>New to Tulip?</Text>
        <Pressable
          onPress={() => router.replace(returnTo ? `/auth/sign-up?returnTo=${returnTo}` : '/auth/sign-up')}
        >
          <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>Create account</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
