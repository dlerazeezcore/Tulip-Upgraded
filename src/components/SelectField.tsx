// Labelled dropdown field. A tap opens a centered list of options with the
// current one ticked — the same affordance as CurrencyPicker/LanguagePicker,
// generalised so admin filters can use it instead of long horizontal chip rows.
//
// Open/closed is UI-affordance state and lives here by design (see CLAUDE.md);
// the selected VALUE always belongs to the caller's wiring hook.
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';

export type SelectOption<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** Falls back to `label` when omitted. */
  accessibilityLabel?: string;
  /** Fill the row it sits in. Default true. */
  flex?: boolean;
};

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  accessibilityLabel,
  flex = true,
}: Props<T>) {
  const t = useTheme();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ flex: flex ? 1 : undefined, gap: 6, minWidth: 120 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: t.fgMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minHeight: 44,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: t.radius.md,
          backgroundColor: t.bgElev,
          borderWidth: 1,
          borderColor: t.border,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: t.font.displayMedium,
            fontWeight: '700',
            fontSize: 14,
            color: t.fg,
          }}
        >
          {selected?.label ?? ''}
        </Text>
        <ChevronDown size={16} color={t.fgMuted} strokeWidth={2.2} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: t.scrim,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          {/* Swallows taps so choosing an option never closes via the backdrop. */}
          <Pressable
            onPress={() => {}}
            style={{
              width: '100%',
              maxWidth: 360,
              maxHeight: height * 0.7,
              backgroundColor: t.bgElev,
              borderRadius: t.radius.lg,
              borderWidth: 1,
              borderColor: t.border,
              overflow: 'hidden',
              ...t.shadow3,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: t.fgMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 8,
              }}
            >
              {label}
            </Text>
            <ScrollView>
              {options.map((o) => {
                const on = o.value === value;
                return (
                  <Pressable
                    key={String(o.value)}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      backgroundColor: on ? t.bgSunken : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: on ? '700' : '500',
                        color: on ? t.fg : t.fgMuted,
                      }}
                    >
                      {o.label}
                    </Text>
                    {on && <Check size={16} color={t.primary} strokeWidth={2.5} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
