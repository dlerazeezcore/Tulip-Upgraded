// THIN UI — wiring lives in src/screens/auth/useSignUp.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AuthShell } from '@/components/AuthShell';
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
      {vm.step === 'phone' ? (
        <>
          {/* One field. Name and password are set later, not asked for here. */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {tr('auth.phoneNumber')}
            </Text>
            <CountryPhoneField onChange={vm.setPhone} value={vm.phone} autoFocus />
          </View>

          <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.otpWhatsappHint')}</Text>
          <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.addNameLater')}</Text>
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
          focusSignal={vm.focusSignal}
          maybeSent={vm.maybeSent}
          resendIn={vm.resendIn}
          expiresIn={vm.expiresIn}
          canResend={vm.canResend}
          canRetry={vm.canRetry}
          busy={vm.busy}
          error={vm.error}
          busyLabel={tr('auth.creating')}
          onRetry={vm.onRetryVerify}
          onBack={vm.backToPhone}
          backLabel={tr('auth.changeNumber')}
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
