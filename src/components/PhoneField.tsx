import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

/** Local-number phone input with a fixed +964 (Iraq) country prefix. */
export function PhoneField({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.bgElev,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: t.radius.md,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 14,
          backgroundColor: t.bgSunken,
          // Logical borderEnd so the prefix/input divider flips with RTL (ar/ku).
          borderEndWidth: 1,
          borderEndColor: t.border,
        }}
      >
        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>
          +964
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^\d]/g, '').slice(0, 11))}
        keyboardType="phone-pad"
        autoFocus={autoFocus}
        placeholder="750 123 4567"
        placeholderTextColor={t.fgFaint}
        style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: t.fg, fontFamily: t.font.bodyMedium }}
      />
    </View>
  );
}
