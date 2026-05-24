import React from 'react';
import { ScrollView, Pressable, View, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICES, Service } from '@/data/services';
import { useSearchStore } from '@/state/searchStore';

/**
 * Service selector tabs.
 * `onDark` renders for placement over a dark photo/blur hero — white-on-dark
 * styling that stays legible in both light and dark themes.
 */
export function MultiServiceTabs({
  compact = false,
  onDark = false,
}: {
  compact?: boolean;
  onDark?: boolean;
}) {
  const t = useTheme();
  const active = useSearchStore((s) => s.activeService);
  const setActive = useSearchStore((s) => s.setActive);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: compact ? 6 : 6, paddingVertical: 2, paddingRight: 8 }}
    >
      {SERVICES.map((s) => {
        const on = s.id === active;
        const Icon = s.Icon;

        // Colors differ for the dark hero vs normal surfaces.
        const bg = onDark
          ? on
            ? '#FFFFFF'
            : 'rgba(255,255,255,0.16)'
          : on
            ? s.tint
            : 'transparent';
        const borderColor = onDark
          ? on
            ? '#FFFFFF'
            : 'rgba(255,255,255,0.28)'
          : on
            ? s.color
            : 'transparent';
        const contentColor = onDark
          ? on
            ? s.color
            : 'rgba(255,255,255,0.95)'
          : on
            ? s.color
            : t.fgMuted;

        return (
          <Pressable
            key={s.id}
            onPress={() => setActive(s.id as Service['id'])}
            style={{
              paddingVertical: compact ? 8 : 9,
              paddingHorizontal: compact ? 12 : 14,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: bg,
              borderWidth: 1.5,
              borderColor,
            }}
          >
            <Icon size={compact ? 13 : 15} color={contentColor} strokeWidth={2} />
            <Text
              style={{
                fontFamily: t.font.display,
                fontWeight: '700',
                fontSize: compact ? 12 : 13,
                color: contentColor,
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
