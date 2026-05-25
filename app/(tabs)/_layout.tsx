import React from 'react';
import { useWindowDimensions, View, Platform, Text, Pressable } from 'react-native';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { NAV } from '@/data/services';
import { TulipLogo } from '@/components/TulipLogo';
import { TulipTabBar } from '@/components/TulipTabBar';

function Sidebar() {
  const t = useTheme();
  const router = useRouter();
  const segments = useSegments();
  // first segment after (tabs) — e.g. "services", "trips"; empty string = home
  const current = segments[segments.length - 1] === '(tabs)' ? '' : (segments[segments.length - 1] as string);

  const activeKey = (() => {
    if (!current || current === 'index') return 'home';
    if (NAV.find((n) => n.key === current)) return current;
    return 'home';
  })();

  return (
    <View
      style={{
        width: 240,
        borderRightWidth: 1,
        borderRightColor: t.border,
        backgroundColor: t.bgElev,
        paddingTop: 24,
        paddingHorizontal: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28, paddingHorizontal: 6 }}>
        <TulipLogo size={32} color={t.primary} />
        <Text style={{ fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>
          Tulip Booking
        </Text>
      </View>

      {NAV.map((n) => {
        const Icon = n.Icon;
        const on = n.key === activeKey;
        return (
          <Pressable
            key={n.key}
            onPress={() => router.push(n.route as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: on ? t.primary : 'transparent',
              marginBottom: 4,
            }}
          >
            <Icon size={18} color={on ? '#fff' : t.fgMuted} strokeWidth={2} />
            <Text
              style={{
                fontFamily: t.font.displayMedium,
                fontWeight: '600',
                color: on ? '#fff' : t.fg,
                fontSize: 14,
              }}
            >
              {n.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 1024;

  if (isWide) {
    return (
      // Explicit window height: on web a flex:1 chain can collapse to 0 height,
      // leaving the screen blank. Pin the row to the viewport height instead.
      <View style={{ height, width: '100%', flexDirection: 'row', backgroundColor: t.bg }}>
        <Sidebar />
        <View style={{ flex: 1, height }}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }}
          >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="services" />
            <Tabs.Screen name="bookings" />
            <Tabs.Screen name="inbox" />
            <Tabs.Screen name="profile" />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TulipTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="services" options={{ title: 'Services' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
