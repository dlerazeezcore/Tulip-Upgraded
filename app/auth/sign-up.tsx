// THIN UI — wiring lives in src/screens/auth/useSignUp.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { UserPlus, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AuthShell, Field, PasswordField } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { OtpCodeStep } from '@/components/OtpCodeStep';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useSignUp } from '@/screens/auth/useSignUp';

export default function SignUp() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useSignUp();

  return (
    <AuthShell title={tr('auth.signUpTitle')} subtitle={tr('auth.signUpSubtitle')}>
      {vm.step === 'details' ? (
        <>
          <Field label={tr('auth.fullName')} value={vm.name} onChangeText={vm.setName} placeholder={tr('auth.namePlaceholder')} />

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {tr('auth.phoneNumber')}
            </Text>
            <CountryPhoneField onChange={vm.setPhone} value={vm.phone} />
          </View>

          <PasswordField
            label={tr('auth.password')}
            value={vm.password}
            onChangeText={vm.setPassword}
            placeholder={tr('auth.createPasswordPlaceholder')}
          />
          <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.otpWhatsappHint')}</Text>
          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          <PrimaryButton
            label={vm.busy ? tr('auth.sending') : tr('auth.sendCode')}
            icon={<MessageCircle size={16} color={t.onPrimary} strokeWidth={2.2} />}
            onPress={vm.onContinue}
            loading={vm.busy}
          />
        </>
      ) : (
        <OtpCodeStep
          phone={vm.phone}
          code={vm.code}
          onChangeCode={vm.setCode}
          maybeSent={vm.maybeSent}
          resendIn={vm.resendIn}
          expiresIn={vm.expiresIn}
          canResend={vm.canResend}
          busy={vm.busy}
          error={vm.error}
          submitLabel={vm.busy ? tr('auth.creating') : tr('auth.verifyAndCreate')}
          submitIcon={<UserPlus size={16} color={t.onPrimary} strokeWidth={2.2} />}
          onSubmit={vm.onVerifyAndCreate}
          onBack={vm.backToDetails}
          backLabel={tr('auth.back')}
          onResend={vm.onResend}
        />
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted }}>{tr('auth.alreadyHaveAccount')}</Text>
        <Pressable onPress={vm.goSignIn} hitSlop={8} accessibilityRole="button">
          <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>{tr('common.signIn')}</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
