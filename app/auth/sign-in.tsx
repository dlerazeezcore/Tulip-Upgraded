// THIN UI — wiring lives in src/screens/auth/useSignIn.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LogIn, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AuthShell, AuthSegmented, PasswordField } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { OtpCodeStep } from '@/components/OtpCodeStep';
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
      {/* WhatsApp code first: it is the default and the only method every account
          has. Password stays one tap away. */}
      <AuthSegmented
        options={[
          { id: 'otp', label: tr('auth.tabOtp') },
          { id: 'password', label: tr('auth.tabPassword') },
        ]}
        value={vm.method}
        onChange={vm.onChangeMethod}
      />

      {vm.method === 'otp' ? (
        vm.otpStep === 'phone' ? (
          <>
            <View style={{ gap: 6 }}>
              <PhoneLabel />
              <CountryPhoneField onChange={vm.setPhone} value={vm.phone} />
            </View>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.otpSignInHint')}</Text>
            {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
            <PrimaryButton
              label={vm.busy ? tr('auth.sending') : tr('auth.sendCode')}
              icon={<MessageCircle size={16} color={t.onPrimary} strokeWidth={2.2} />}
              onPress={vm.onSendCode}
              loading={vm.busy}
            />
          </>
        ) : (
          <OtpCodeStep
            phone={vm.phone}
            code={vm.code}
            onChangeCode={vm.setCode}
            focusSignal={vm.focusSignal}
            maybeSent={vm.maybeSent}
            resendIn={vm.resendIn}
            expiresIn={vm.expiresIn}
            canResend={vm.canResend}
            canRetry={vm.canRetry}
            busy={vm.busy}
            error={vm.error}
            busyLabel={tr('auth.verifying')}
            onRetry={vm.onRetryVerify}
            onBack={vm.backToPhone}
            backLabel={tr('auth.changeNumber')}
            onResend={vm.onResend}
          />
        )
      ) : (
        <>
          <View style={{ gap: 6 }}>
            <PhoneLabel />
            <CountryPhoneField onChange={vm.setPhone} value={vm.phone} />
          </View>
          <PasswordField
            label={tr('auth.password')}
            value={vm.password}
            onChangeText={vm.setPassword}
            placeholder={tr('auth.passwordPlaceholder')}
          />
          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          <PrimaryButton
            label={vm.busy ? tr('auth.signingIn') : tr('common.signIn')}
            icon={<LogIn size={16} color={t.onPrimary} strokeWidth={2.2} />}
            onPress={vm.onPasswordSignIn}
            loading={vm.busy}
          />
        </>
      )}

      {/* Outside the method branches: this is also how a WhatsApp-only account SETS
          a first password, so it must not be reachable only from the password tab. */}
      {!(vm.method === 'otp' && vm.otpStep === 'code') && (
        <Pressable onPress={vm.goForgot} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: t.primary, fontWeight: '700' }}>{tr('auth.forgotPassword')}</Text>
        </Pressable>
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
