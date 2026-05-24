import React from 'react';
import { ScrollView, Pressable, View, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICES, Service } from '@/data/services';
import { useSearchStore } from '@/state/searchStore';

export function MultiServiceTabs({ compact = false }: { compact?: boolean }) {
  const t = useTheme();
  const active = useSearchStore((s) => s.activeService);
  const setActive = useSearchStore((s) => s.setActive);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: compact ? 4 : 6, paddingVertical: 2 }}
    >
      {SERVICES.map((s) => {
        const on = s.id === active;
        const Icon = s.Icon;
        return (
          <Pressable
            key={s.id}
            onPress={() => setActive(s.id as Service['id'])}
            style={{
              paddingVertical: compact ? 8 : 10,
              paddingHorizontal: compact ? 12 : 16,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: on ? s.tint : 'transparent',
              borderWidth: 1.5,
              borderColor: on ? s.color : 'transparent',
            }}
          >
            <Icon size={compact ? 13 : 14} color={on ? s.color : t.fgMuted} strokeWidth={2} />
            <Text
              style={{
                fontFamily: t.font.display,
                fontWeight: '700',
                fontSize: compact ? 12 : 13,
                color: on ? s.color : t.fgMuted,
              }}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
