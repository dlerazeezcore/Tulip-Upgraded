// THIN UI — wiring lives in src/screens/auth/useSignUp.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { UserPlus, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AuthShell, AuthSegmented, Field, PasswordField } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useSignUp } from '@/screens/auth/useSignUp';

export default function SignUp() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useSignUp();

  return (
    <AuthShell title={tr('auth.signUpTitle')} subtitle={tr('auth.signUpSubtitle')}>
      <Field label={tr('auth.fullName')} value={vm.name} onChangeText={vm.setName} placeholder={tr('auth.namePlaceholder')} />

      <AuthSegmented
        options={[
          { id: 'password', label: tr('auth.tabPassword') },
          { id: 'otp', label: tr('auth.tabOtp') },
        ]}
        value={vm.mode}
        onChange={vm.onChangeMode}
      />

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {tr('auth.phoneNumber')}
        </Text>
        <CountryPhoneField onChange={vm.setPhone} />
      </View>

      {vm.mode === 'password' ? (
        <>
          <PasswordField
            label={tr('auth.password')}
            value={vm.password}
            onChangeText={vm.setPassword}
            placeholder={tr('auth.createPasswordPlaceholder')}
          />
          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          <PrimaryButton
            label={vm.busy ? tr('auth.creating') : tr('auth.createAccount')}
            icon={<UserPlus size={16} color={t.onPrimary} strokeWidth={2.2} />}
            onPress={vm.onPasswordSignUp}
          />
        </>
      ) : !vm.otpSent ? (
        <>
          <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.verifyNumberHint')}</Text>
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
          <PrimaryButton label={vm.busy ? tr('auth.verifying') : tr('auth.verifyAndCreate')} onPress={vm.onVerify} />
          <Pressable onPress={() => vm.setOtpSent(false)} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.changeNumber')}</Text>
          </Pressable>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted }}>{tr('auth.alreadyHaveAccount')}</Text>
        <Pressable
          onPress={vm.goSignIn}
        >
          <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>{tr('common.signIn')}</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
