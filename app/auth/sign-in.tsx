import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LogIn, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/state/authStore';
import { AuthShell, AuthSegmented, Field, PasswordField } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';

type Mode = 'password' | 'otp';
type Identifier = 'phone' | 'email';

export default function SignIn() {
  const t = useTheme();
  const { t: tr } = useTranslation();
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
      setError(e?.message || tr('common.somethingWrong'));
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
    <AuthShell title={tr('auth.signInTitle')} subtitle={tr('auth.signInSubtitle')}>
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

      {mode === 'password' ? (
        <>
          <AuthSegmented
            options={[
              { id: 'phone', label: tr('auth.tabPhone') },
              { id: 'email', label: tr('auth.tabEmail') },
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
                {tr('auth.phoneNumber')}
              </Text>
              <CountryPhoneField onChange={setPhone} />
            </View>
          ) : (
            <Field
              label={tr('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={tr('auth.emailPlaceholder')}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          )}
          <PasswordField
            label={tr('auth.password')}
            value={password}
            onChangeText={setPassword}
            placeholder={tr('auth.passwordPlaceholder')}
          />
          <Pressable onPress={() => router.push('/auth/forgot')} style={{ alignSelf: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: t.primary, fontWeight: '700' }}>{tr('auth.forgotPassword')}</Text>
          </Pressable>
          {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}
          <PrimaryButton
            label={busy ? tr('auth.signingIn') : tr('common.signIn')}
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
          <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.otpSmsHint')}</Text>
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
          <PrimaryButton label={busy ? tr('auth.verifying') : tr('auth.verifyAndSignIn')} onPress={onVerify} />
          <Pressable onPress={() => setOtpSent(false)} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.changeNumber')}</Text>
          </Pressable>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted }}>{tr('auth.newToTulip')}</Text>
        <Pressable
          onPress={() => router.replace(returnTo ? `/auth/sign-up?returnTo=${returnTo}` : '/auth/sign-up')}
        >
          <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>{tr('auth.createAccount')}</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
