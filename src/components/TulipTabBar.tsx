import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';
import { NAV } from '@/data/services';

// Map a route file name to its NAV entry (home == the index route).
function navFor(routeName: string) {
  if (routeName === 'index') return NAV.find((n) => n.key === 'home')!;
  return NAV.find((n) => n.key === routeName) ?? NAV[0];
}

export function TulipTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
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
        // On Android (no real blur) fall back to a solid elevated surface.
        backgroundColor:
          Platform.OS === 'android'
            ? t.bgElev
            : t.mode === 'dark'
              ? 'rgba(20,28,47,0.80)'
              : 'rgba(255,255,255,0.80)',
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
                {item.label}
              </Text>
            </Pressable>
          );
        })}
    </BlurView>
  );
}
