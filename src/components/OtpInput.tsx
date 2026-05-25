import React, { useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

/** 6-cell OTP entry backed by a single hidden input (robust on web + native). */
export function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
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
              height: 54,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: active ? t.primary : filled ? t.borderStrong : t.border,
              backgroundColor: t.bgElev,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 22, color: t.fg }}>
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
        autoFocus
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0 }}
      />
    </Pressable>
  );
}
