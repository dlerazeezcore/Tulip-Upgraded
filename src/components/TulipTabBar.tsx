import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { NAV } from '@/data/services';

// Map a route file name to its NAV entry (home == the index route).
function navFor(routeName: string) {
  if (routeName === 'index') return NAV.find((n) => n.key === 'home')!;
  return NAV.find((n) => n.key === routeName) ?? NAV[0];
}

export function TulipTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <BlurView
      intensity={Platform.OS === 'android' ? 0 : 40}
      tint={t.mode === 'dark' ? 'dark' : 'light'}
      style={{
        flexDirection: 'row',
        paddingTop: 10,
        paddingBottom: bottomPad,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: t.border,
        // On Android (no real blur) fall back to a solid elevated surface; on
        // iOS/web tint with the elevated surface at ~80% over the blur ('CC'
        // = 0xCC ≈ 0.80 alpha), so the colour tracks the theme token.
        backgroundColor: Platform.OS === 'android' ? t.bgElev : t.bgElev + 'CC',
      }}
    >
        {state.routes.map((route, index) => {
          const item = navFor(route.name);
          const Icon = item.Icon;
          const focused = state.index === index;

          const onPress = () => {
            if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: focused ? t.primary + '1A' : 'transparent',
                }}
              >
                <Icon
                  size={22}
                  color={focused ? t.primary : t.fgMuted}
                  strokeWidth={focused ? 2.4 : 2}
                />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: t.font.displayMedium,
                  fontWeight: focused ? '700' : '600',
                  color: focused ? t.primary : t.fgMuted,
                }}
              >
                {tr(`nav.${item.key}`)}
              </Text>
            </Pressable>
          );
        })}
    </BlurView>
  );
}
