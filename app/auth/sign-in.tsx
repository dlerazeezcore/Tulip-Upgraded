import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LogIn, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/state/authStore';
import { AuthShell, AuthSegmented, Field } from '@/components/AuthShell';
import { PhoneField } from '@/components/PhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';

type Mode = 'password' | 'whatsapp';

export default function SignIn() {
  const t = useTheme();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signInPassword, startPhoneFlow, verifyOtp } = useAuthStore();

  const [mode, setMode] = useState<Mode>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');

  const done = () => {
    if (returnTo === 'checkout') router.replace('/esim-store/checkout');
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  const onPasswordSignIn = () => {
    signInPassword(identifier || '+9647501234567', password);
    done();
  };

  const onSendCode = () => {
    startPhoneFlow(`+964${phone}`);
    setOtpSent(true);
  };

  const onVerify = () => {
    if (verifyOtp(code)) done();
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your journey">
      <AuthSegmented
        options={[
          { id: 'password', label: 'Password' },
          { id: 'whatsapp', label: 'WhatsApp' },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setOtpSent(false);
          setCode('');
        }}
      />

      {mode === 'password' ? (
        <>
          <Field
            label="Phone or email"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
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
          <PrimaryButton
            label="Sign in"
            icon={<LogIn size={16} color="#fff" strokeWidth={2.2} />}
            onPress={onPasswordSignIn}
          />
        </>
      ) : !otpSent ? (
        <>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              WhatsApp number
            </Text>
            <PhoneField value={phone} onChange={setPhone} />
          </View>
          <Text style={{ fontSize: 12, color: t.fgMuted }}>
            We'll send a one-time code to your WhatsApp.
          </Text>
          <PrimaryButton
            label="Send code"
            icon={<MessageCircle size={16} color="#fff" strokeWidth={2.2} />}
            onPress={onSendCode}
          />
        </>
      ) : (
        <>
          <Text style={{ fontSize: 13, color: t.fg }}>
            Enter the 6-digit code sent to +964 {phone}
          </Text>
          <OtpInput value={code} onChange={setCode} />
          <PrimaryButton label="Verify & sign in" onPress={onVerify} />
          <Pressable onPress={() => setOtpSent(false)} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>Change number</Text>
          </Pressable>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted }}>New to Tulip?</Text>
        <Pressable
          onPress={() =>
            router.replace(returnTo ? `/auth/sign-up?returnTo=${returnTo}` : '/auth/sign-up')
          }
        >
          <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>Create account</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
