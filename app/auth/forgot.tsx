import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AuthShell, Field } from '@/components/AuthShell';
import { PhoneField } from '@/components/PhoneField';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';

type Step = 'phone' | 'otp' | 'reset' | 'done';

export default function Forgot() {
  const t = useTheme();
  const router = useRouter();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');

  const subtitle =
    step === 'phone'
      ? 'Enter your phone to receive a reset code'
      : step === 'otp'
        ? 'Enter the code we sent'
        : step === 'reset'
          ? 'Choose a new password'
          : 'All set';

  return (
    <AuthShell title="Reset password" subtitle={subtitle}>
      {step === 'phone' && (
        <>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Phone number
            </Text>
            <PhoneField value={phone} onChange={setPhone} autoFocus />
          </View>
          <PrimaryButton label="Send reset code" onPress={() => setStep('otp')} />
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={{ fontSize: 13, color: t.fg }}>Enter the 6-digit code sent to +964 {phone}</Text>
          <OtpInput value={code} onChange={setCode} />
          <PrimaryButton
            label="Verify code"
            onPress={() => {
              if (code.replace(/\D/g, '').length >= 4) setStep('reset');
            }}
          />
          <Pressable onPress={() => setStep('phone')} style={{ alignSelf: 'center' }}>
            <Text style={{ fontSize: 12, color: t.fgMuted }}>Change number</Text>
          </Pressable>
        </>
      )}

      {step === 'reset' && (
        <>
          <Field label="New password" value={pw} onChangeText={setPw} placeholder="New password" secureTextEntry />
          <Field label="Confirm password" value={pw2} onChangeText={setPw2} placeholder="Confirm password" secureTextEntry />
          {pw.length > 0 && pw !== pw2 && (
            <Text style={{ fontSize: 12, color: t.danger }}>Passwords don't match</Text>
          )}
          <PrimaryButton
            label="Reset password"
            onPress={() => {
              if (pw.length >= 4 && pw === pw2) setStep('done');
            }}
          />
        </>
      )}

      {step === 'done' && (
        <>
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(22,163,74,0.14)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={30} color={t.success} strokeWidth={2.5} />
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
              Password reset
            </Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>
              You can now sign in with your new password.
            </Text>
          </View>
          <PrimaryButton label="Back to sign in" onPress={() => router.replace('/auth/sign-in')} />
        </>
      )}
    </AuthShell>
  );
}
