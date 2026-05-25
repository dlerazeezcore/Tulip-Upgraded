import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserPlus, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/state/authStore';
import { AuthShell, AuthSegmented, Field } from '@/components/AuthShell';
import { PhoneField } from '@/components/PhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';

type Mode = 'password' | 'whatsapp';

export default function SignUp() {
  const t = useTheme();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signUp, startPhoneFlow, verifyOtp } = useAuthStore();

  const [mode, setMode] = useState<Mode>('password');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');

  const done = () => {
    if (returnTo === 'checkout') router.replace('/esim-store/checkout');
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  const onPasswordSignUp = () => {
    signUp(name, `+964${phone}`, email || undefined);
    done();
  };

  const onSendCode = () => {
    startPhoneFlow(`+964${phone}`);
    setOtpSent(true);
  };

  const onVerify = () => {
    if (verifyOtp(code, name)) done();
  };

  return (
    <AuthShell title="Create account" subtitle="Join Tulip — one app for every trip">
      <Field label="Full name" value={name} onChangeText={setName} placeholder="Jane Olsen" />

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

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Phone number
        </Text>
        <PhoneField value={phone} onChange={setPhone} />
      </View>

      {mode === 'password' ? (
        <>
          <Field
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
          />
          <PrimaryButton
            label="Create account"
            icon={<UserPlus size={16} color="#fff" strokeWidth={2.2} />}
            onPress={onPasswordSignUp}
          />
        </>
      ) : !otpSent ? (
        <>
          <Text style={{ fontSize: 12, color: t.fgMuted }}>
            We'll verify your number with a WhatsApp code.
          </Text>
          <PrimaryButton
            label="Send code"
            icon={<MessageCircle size={16} color="#fff" strokeWidth={2.2} />}
            onPress={onSendCode}
          />
        </>
      ) : (
        <>
          <Text style={{ fontSize: 13, color: t.fg }}>Enter the 6-digit code sent to +964 {phone}</Text>
          <OtpInput value={code} onChange={setCode} />
          <PrimaryButton label="Verify & create" onPress={onVerify} />
          <Pressable onPress={() => setOtpSent(false)} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>Change number</Text>
          </Pressable>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted }}>Already have an account?</Text>
        <Pressable
          onPress={() =>
            router.replace(returnTo ? `/auth/sign-in?returnTo=${returnTo}` : '/auth/sign-in')
          }
        >
          <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>Sign in</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
