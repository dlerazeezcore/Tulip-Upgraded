import React, { useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { OTP_CODE_LENGTH } from '@/services/auth';

/** OTP entry backed by a single hidden input (robust on web + native). Tapping
 *  anywhere focuses it; cells reflect the typed digits. Defaults to the
 *  WhatsApp code length. */
export function OtpInput({
  value,
  onChange,
  length = OTP_CODE_LENGTH,
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const t = useTheme();
  const ref = useRef<TextInput>(null);

  return (
    <Pressable onPress={() => ref.current?.focus()} style={{ flexDirection: 'row', gap: 8 }}>
      {Array.from({ length }).map((_, i) => {
        const active = i === value.length;
        const filled = i < value.length;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: 56,
              borderRadius: t.radius.md,
              borderWidth: 1.5,
              borderColor: active ? t.primary : filled ? t.borderStrong : t.border,
              backgroundColor: t.bgElev,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 24, color: t.fg }}>
              {value[i] ?? ''}
            </Text>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        // Enables SMS/WhatsApp autofill of the one-time code on iOS/Android.
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0 }}
      />
    </Pressable>
  );
}
