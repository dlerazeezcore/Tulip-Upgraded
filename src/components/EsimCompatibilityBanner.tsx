// THIN UI — wiring lives in src/components/useEsimCompatibilityBanner.ts.
// Compatibility rectangle shown right below the eSIM Store title:
//   green  → "Your device is compatible"
//   red    → "Your device may not support eSIM" + "How to check"
//   neutral→ "We couldn't detect your device …" + "How to check" (web / Expo Go)
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useEsimCompatibilityBanner } from './useEsimCompatibilityBanner';

export function EsimCompatibilityBanner() {
  const t = useTheme();
  const vm = useEsimCompatibilityBanner();
  const { Icon } = vm;
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={vm.title}
      style={{
        padding: 12,
        borderRadius: 14,
        backgroundColor: vm.bg,
        borderWidth: 1,
        borderColor: vm.borderColor,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon size={18} color={vm.fg} strokeWidth={2.2} />
        <Text style={{ flex: 1, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 13.5, color: vm.fg, lineHeight: 18 }}>
          {vm.title}
        </Text>
      </View>

      {vm.showHelp && (
        <>
          <Pressable
            onPress={vm.toggleHelp}
            accessibilityRole="button"
            accessibilityState={{ expanded: vm.helpExpanded }}
            accessibilityLabel={vm.helpLabel}
            hitSlop={8}
            style={{ alignSelf: 'flex-start' }}
          >
            <Text style={{ fontFamily: t.font.bodyMedium, fontWeight: '600', fontSize: 12.5, color: vm.fg, textDecorationLine: 'underline' }}>
              {vm.helpLabel}
            </Text>
          </Pressable>
          {vm.helpExpanded && (
            <Text style={{ fontSize: 12, color: t.fgMuted, lineHeight: 17 }}>{vm.helpBody}</Text>
          )}
        </>
      )}
    </View>
  );
}
