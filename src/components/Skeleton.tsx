import React from 'react';
import { Animated, Easing, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

/**
 * Shimmering placeholder block. Replaces bare ActivityIndicator spinners so
 * loading states keep the page's shape (less layout jump, feels faster).
 * Pure opacity pulse via Animated — works on iOS / Android / web with no
 * native deps.
 */
export function Skeleton({
  width,
  height = 14,
  radius,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const pulse = React.useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius: radius ?? t.radius.sm,
          backgroundColor: t.bgSunken,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

/** A skeleton shaped like an eSIM/list card — flag circle + two text lines +
 *  a usage bar. Used while the eSIM list / home card load. */
export function EsimCardSkeleton() {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.bgElev,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: t.radius.md,
        padding: 14,
        gap: 12,
        ...t.shadow1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={40} height={40} radius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="35%" height={11} />
        </View>
        <Skeleton width={52} height={22} radius={t.radius.pill} />
      </View>
      <Skeleton width="100%" height={6} radius={3} />
    </View>
  );
}

/** Render `count` card skeletons with consistent spacing. */
export function EsimListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <EsimCardSkeleton key={i} />
      ))}
    </View>
  );
}

/** A skeleton shaped like the travelers list — one card per traveler (avatar
 *  circle, two text lines, edit + remove action circles). */
export function TravelerListSkeleton({ count = 3 }: { count?: number }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10, width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: t.radius.card, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}
        >
          <Skeleton width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="45%" height={14} />
            <Skeleton width="30%" height={11} />
          </View>
          <Skeleton width={36} height={36} radius={18} />
          <Skeleton width={36} height={36} radius={18} />
        </View>
      ))}
    </View>
  );
}

/** A skeleton shaped like the orders list — a group label above a card of
 *  order rows (flag circle, two text lines, price + status pill). */
export function OrderListSkeleton({ rows = 4 }: { rows?: number }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Skeleton width={90} height={11} style={{ marginHorizontal: 4 }} />
      <View style={{ backgroundColor: t.bgElev, borderRadius: t.radius.card, borderColor: t.border, borderWidth: 1, overflow: 'hidden', ...t.shadow1 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
              borderBottomWidth: i === rows - 1 ? 0 : 1, borderBottomColor: t.border,
            }}
          >
            <Skeleton width={38} height={38} radius={19} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="55%" height={14} />
              <Skeleton width="35%" height={11} />
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Skeleton width={64} height={14} />
              <Skeleton width={72} height={22} radius={t.radius.pill} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
