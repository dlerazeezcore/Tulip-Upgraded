import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

/**
 * Consistent failed-fetch state: EmptyState's silhouette with error accents and
 * a mandatory retry action — so a failed request never masquerades as
 * "no data yet". Presentational only: the owning hook decides when a load
 * counts as errored (typically: error set and nothing cached to show) and
 * supplies the retry.
 */
export function ErrorState({
  title,
  subtitle,
  onRetry,
}: {
  /** Defaults to the generic localized "couldn't load" copy. */
  title?: string;
  subtitle?: string;
  onRetry: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 44, paddingHorizontal: 28, gap: 12 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: t.dangerBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertCircle size={30} color={t.danger} strokeWidth={1.9} />
      </View>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg, textAlign: 'center' }}>
          {title ?? tr('common.loadErrorTitle')}
        </Text>
        <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center', lineHeight: 19, maxWidth: 320 }}>
          {subtitle ?? tr('common.loadErrorSub')}
        </Text>
      </View>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed }) => ({
          marginTop: 4,
          paddingVertical: 9,
          paddingHorizontal: 18,
          borderRadius: t.radius.pill,
          borderWidth: 1.5,
          borderColor: t.primary,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: t.primary, fontWeight: '700', fontSize: 13, fontFamily: t.font.displayMedium }}>
          {tr('common.tryAgain')}
        </Text>
      </Pressable>
    </View>
  );
}
