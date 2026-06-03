import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
  const { t: tr } = useTranslation();
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
      setError(e?.message || tr('common.somethingWrong'));
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
    <AuthShell title={tr('auth.signUpTitle')} subtitle={tr('auth.signUpSubtitle')}>
      <Field label={tr('auth.fullName')} value={name} onChangeText={setName} placeholder={tr('auth.namePlaceholder')} />

      <AuthSegmented
        options={[
          { id: 'password', label: tr('auth.tabPassword') },
          { id: 'otp', label: tr('auth.tabOtp') },
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
          {tr('auth.phoneNumber')}
        </Text>
        <CountryPhoneField onChange={setPhone} />
      </View>

      {mode === 'password' ? (
        <>
          <PasswordField
            label={tr('auth.password')}
            value={password}
            onChangeText={setPassword}
            placeholder={tr('auth.createPasswordPlaceholder')}
          />
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={busy ? tr('auth.creating') : tr('auth.createAccount')}
            icon={<UserPlus size={16} color="#fff" strokeWidth={2.2} />}
            onPress={onPasswordSignUp}
          />
        </>
      ) : !otpSent ? (
        <>
          <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.verifyNumberHint')}</Text>
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={busy ? tr('auth.sending') : tr('auth.sendCode')}
            icon={<MessageCircle size={16} color="#fff" strokeWidth={2.2} />}
            onPress={onSendCode}
          />
        </>
      ) : (
        <>
          <Text style={{ fontSize: 13, color: t.fg }}>{tr('auth.enterCodeSentTo', { phone })}</Text>
          <OtpInput value={code} onChange={setCode} />
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton label={busy ? tr('auth.verifying') : tr('auth.verifyAndCreate')} onPress={onVerify} />
          <Pressable onPress={() => setOtpSent(false)} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.changeNumber')}</Text>
          </Pressable>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted }}>{tr('auth.alreadyHaveAccount')}</Text>
        <Pressable
          onPress={() => router.replace(returnTo ? `/auth/sign-in?returnTo=${returnTo}` : '/auth/sign-in')}
        >
          <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>{tr('common.signIn')}</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
