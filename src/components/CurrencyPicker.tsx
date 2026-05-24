import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useCurrencyStore } from '@/state/currencyStore';
import { CURRENCY_LIST } from '@/data/currency';
import { Flag } from './Flag';

/** Compact header chip that opens a currency picker sheet. */
export function CurrencyPicker() {
  const t = useTheme();
  const code = useCurrencyStore((s) => s.code);
  const setCode = useCurrencyStore((s) => s.setCode);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          height: 40,
          paddingHorizontal: 12,
          borderRadius: 20,
          backgroundColor: t.bgElev,
          borderWidth: 1,
          borderColor: t.border,
          ...t.shadow1,
        }}
      >
        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 13, color: t.fg }}>
          {code}
        </Text>
        <ChevronDown size={14} color={t.fgMuted} strokeWidth={2.2} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
        >
          <Pressable
            style={{
              width: '100%',
              maxWidth: 360,
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
                fontFamily: t.font.display,
                fontWeight: '700',
                fontSize: 16,
                color: t.fg,
                padding: 16,
                paddingBottom: 8,
              }}
            >
              Currency
            </Text>
            {CURRENCY_LIST.map((c) => {
              const on = c.code === code;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    setCode(c.code);
                    setOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 13,
                    paddingHorizontal: 16,
                    backgroundColor: on ? t.bgSunken : 'transparent',
                  }}
                >
                  <Flag iso={c.flag} size={26} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
                      {c.code} · {c.symbol}
                    </Text>
                    <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{c.name}</Text>
                  </View>
                  {on && <Check size={18} color={t.primary} strokeWidth={2.4} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
