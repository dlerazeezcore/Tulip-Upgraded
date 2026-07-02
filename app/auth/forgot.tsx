// THIN UI — wiring lives in src/screens/auth/useForgot.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AuthShell, Field, PasswordField } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useForgot } from '@/screens/auth/useForgot';

export default function Forgot() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useForgot();

  return (
    <AuthShell title={tr('auth.resetTitle')} subtitle={vm.subtitle}>
      {vm.step === 'phone' && (
        <>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {tr('auth.phoneNumber')}
            </Text>
            <CountryPhoneField onChange={vm.setPhone} autoFocus />
          </View>
          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          <PrimaryButton
            label={vm.busy ? tr('auth.sending') : tr('auth.sendResetCode')}
            onPress={vm.onSendResetCode}
          />
        </>
      )}

      {vm.step === 'otp' && (
        <>
          <Text style={{ fontSize: 13, color: t.fg }}>{tr('auth.enterCodeSentTo', { phone: vm.phone })}</Text>
          <OtpInput value={vm.code} onChange={vm.setCode} />
          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          <PrimaryButton
            label={tr('common.continue')}
            onPress={vm.onContinueOtp}
          />
          <Pressable onPress={vm.backToPhone} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>{tr('auth.changeNumber')}</Text>
          </Pressable>
        </>
      )}

      {vm.step === 'reset' && (
        <>
          <PasswordField label={tr('auth.newPassword')} value={vm.pw} onChangeText={vm.setPw} placeholder={tr('auth.newPasswordPlaceholder')} />
          <PasswordField label={tr('auth.confirmPassword')} value={vm.pw2} onChangeText={vm.setPw2} placeholder={tr('auth.confirmPasswordPlaceholder')} />
          {vm.pw.length > 0 && vm.pw !== vm.pw2 && (
            <Text style={{ fontSize: 12, color: t.danger }}>{tr('auth.passwordsDontMatch')}</Text>
          )}
          {vm.error && <Text style={{ fontSize: 12, color: t.danger }}>{vm.error}</Text>}
          <PrimaryButton
            label={vm.busy ? tr('auth.resetting') : tr('auth.resetPassword')}
            onPress={vm.onResetPassword}
          />
        </>
      )}

      {vm.step === 'done' && (
        <>
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: t.successBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={30} color={t.success} strokeWidth={2.5} />
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
              {tr('auth.passwordResetDone')}
            </Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>
              {tr('auth.signedInNewPassword')}
            </Text>
          </View>
          <PrimaryButton label={tr('common.continue')} onPress={vm.goProfile} />
        </>
      )}
    </AuthShell>
  );
}
