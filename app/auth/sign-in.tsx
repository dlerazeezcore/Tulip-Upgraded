// THIN UI — wiring lives in src/screens/auth/useSignIn.ts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AuthShell, AuthSegmented, Field, PasswordField } from '@/components/AuthShell';
import { CountryPhoneField } from '@/components/CountryPhoneField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useSignIn } from '@/screens/auth/useSignIn';

export default function SignIn() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useSignIn();

  return (
    <AuthShell title={tr('auth.signInTitle')} subtitle={tr('auth.signInSubtitle')}>
      <AuthSegmented
        options={[
          { id: 'phone', label: tr('auth.tabPhone') },
          { id: 'email', label: tr('auth.tabEmail') },
        ]}
        value={vm.identifier}
        onChange={vm.onChangeIdentifier}
      />
      {vm.identifier === 'phone' ? (
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {tr('auth.phoneNumber')}
          </Text>
          <CountryPhoneField onChange={vm.setPhone} />
        </View>
      ) : (
        <Field
          label={tr('auth.email')}
          value={vm.email}
          onChangeText={vm.setEmail}
          placeholder={tr('auth.emailPlaceholder')}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      )}
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
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted }}>{tr('auth.newToTulip')}</Text>
        <Pressable onPress={vm.goSignUp} hitSlop={8} accessibilityRole="button">
          <Text style={{ fontSize: 13, color: t.primary, fontWeight: '700' }}>{tr('auth.createAccount')}</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
