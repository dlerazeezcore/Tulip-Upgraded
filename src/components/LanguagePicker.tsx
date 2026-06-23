import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useLocaleStore } from '@/state/localeStore';
import type { Lang } from '@/i18n';

const LANGS: { id: Lang; native: string; sub: string }[] = [
  { id: 'en', native: 'English', sub: 'English' },
  { id: 'ar', native: 'العربية', sub: 'Arabic' },
  { id: 'ku', native: 'کوردی', sub: 'Kurdish (Sorani)' },
];

/** Compact chip + modal language picker (mirrors CurrencyPicker). */
export function LanguagePicker() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.id === language) ?? LANGS[0];

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
          {current.native}
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
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg, padding: 16, paddingBottom: 8 }}>
              {tr('onboarding.language')}
            </Text>
            {LANGS.map((l) => {
              const on = l.id === language;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => {
                    setLanguage(l.id);
                    setOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    backgroundColor: on ? t.bgSunken : 'transparent',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>
                      {l.native}
                    </Text>
                    <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{l.sub}</Text>
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
