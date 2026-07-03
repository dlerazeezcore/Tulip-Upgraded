import React from 'react';
import { ScrollView, Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  onSelect,
}: {
  compact?: boolean;
  onDark?: boolean;
  /** If provided, called when a tab is tapped INSTEAD of just setting the
   *  store. The search screen uses this to update its route param so the
   *  form reliably matches the selected service. When omitted (e.g. the home
   *  hero), tapping a tab simply updates the active service in the store. */
  onSelect?: (id: Service['id']) => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const active = useSearchStore((s) => s.activeService);
  const setActive = useSearchStore((s) => s.setActive);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: compact ? 6 : 6, paddingVertical: 2, paddingEnd: 8 }}
    >
      {SERVICES.map((s) => {
        const on = s.id === active;
        const Icon = s.Icon;

        // Colors differ for the dark hero vs normal surfaces. On-hero tints are
        // derived from t.onPrimary with hex-alpha suffixes (0x29≈16%, 0x47≈28%,
        // 0xF2≈95%) instead of ad-hoc rgba literals.
        const bg = onDark
          ? on
            ? t.onPrimary
            : `${t.onPrimary}29`
          : on
            ? s.tint
            : 'transparent';
        const borderColor = onDark
          ? on
            ? t.onPrimary
            : `${t.onPrimary}47`
          : on
            ? s.color
            : 'transparent';
        const contentColor = onDark
          ? on
            ? s.color
            : `${t.onPrimary}F2`
          : on
            ? s.color
            : t.fgMuted;

        return (
          <Pressable
            key={s.id}
            onPress={() => (onSelect ? onSelect(s.id as Service['id']) : setActive(s.id as Service['id']))}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
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
              {tr(`serviceNames.${s.id}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
