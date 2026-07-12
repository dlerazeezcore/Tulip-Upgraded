// THIN UI — wiring lives in src/screens/auth/useSignIn.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LogIn, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AuthShell, AuthSegmented, PasswordField } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useSignIn } from '@/screens/auth/useSignIn';

function PhoneLabel() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {tr('auth.phoneNumber')}
    </Text>
  );
}

export default function SignIn() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useSignIn();

  return (
    <AuthShell title={tr('auth.signInTitle')} subtitle={tr('auth.signInSubtitle')}>
      <AuthSegmented
        options={[
          { id: 'password', label: tr('auth.tabPassword') },
          { id: 'otp', label: tr('auth.tabOtp') },
        ]}
        value={vm.method}
        onChange={vm.onChangeMethod}
      />

      {vm.method === 'password' ? (
        <>
          <View style={{ gap: 6 }}>
            <PhoneLabel />
            <CountryPhoneField onChange={vm.setPhone} />
          </View>
          <PasswordField
            label={tr('auth.password')}
            value={vm.password}
            onChangeText={vm.setPassword}
            placeholder={tr('auth.passwordPlaceholder')}
          />
          <Pressable onPress={vm.goForgot} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: t.primary, fontWeight: '700' }}>{tr('auth.forgotPassword')}</Text>
          </Pressable>
          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          <PrimaryButton
            label={vm.busy ? tr('auth.signingIn') : tr('common.signIn')}
            icon={<LogIn size={16} color={t.onPrimary} strokeWidth={2.2} />}
            onPress={vm.onPasswordSignIn}
          />
        </>
      ) : vm.otpStep === 'phone' ? (
        <>
          <View style={{ gap: 6 }}>
            <PhoneLabel />
            <CountryPhoneField onChange={vm.setPhone} />
          </View>
          <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.otpWhatsappHint')}</Text>
          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          <PrimaryButton
            label={vm.busy ? tr('auth.sending') : tr('auth.sendCode')}
            icon={<MessageCircle size={16} color={t.onPrimary} strokeWidth={2.2} />}
            onPress={vm.onSendCode}
          />
        </>
      ) : (
        <>
          <Text style={{ fontSize: 13, color: t.fg }}>{tr('auth.enterCodeSentTo', { phone: vm.phone })}</Text>
          <OtpInput value={vm.code} onChange={vm.setCode} />
          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          <PrimaryButton
            label={vm.busy ? tr('auth.verifying') : tr('auth.verifyAndSignIn')}
            onPress={vm.onVerifyAndSignIn}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable onPress={vm.backToPhone} hitSlop={8} accessibilityRole="button">
              <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.changeNumber')}</Text>
            </Pressable>
            <Pressable onPress={vm.onResend} hitSlop={8} accessibilityRole="button" disabled={vm.busy}>
              <Text style={{ fontSize: 12, color: t.primary, fontWeight: '700' }}>{tr('auth.resendCode')}</Text>
            </Pressable>
          </View>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted }}>{tr('auth.newToTulip')}</Text>
        <Pressable onPress={vm.goSignUp} hitSlop={8} accessibilityRole="button">
          <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>{tr('auth.createAccount')}</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
