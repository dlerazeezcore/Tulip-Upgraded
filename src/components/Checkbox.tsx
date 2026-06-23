import React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';

export function Checkbox({
  checked,
  onChange,
  size = 16,
}: {
  checked: boolean;
  onChange: () => void;
  size?: number;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onChange} hitSlop={8}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          backgroundColor: checked ? t.primary : t.bgSunken,
          borderWidth: checked ? 0 : 1.5,
          borderColor: t.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Check size={size - 6} color={t.onPrimary} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}
