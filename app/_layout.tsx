import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts as useOutfit,
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  useFonts as useJakarta,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { useThemeStore } from '@/state/themeStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedStack() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="search/[service]" options={{ presentation: 'card' }} />
        <Stack.Screen name="results/flights" />
        <Stack.Screen name="results/hotels" />
        <Stack.Screen name="trip/[id]" />
        <Stack.Screen name="manage/[service]" />
        <Stack.Screen name="esim/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const hydrate = useThemeStore((s) => s.hydrate);
  const hydrated = useThemeStore((s) => s.hydrated);

  const [outfitLoaded, outfitError] = useOutfit({ Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold });
  const [jakartaLoaded, jakartaError] = useJakarta({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // On web, font loading can occasionally fail or timeout; don't block initial render forever.
  const ready = (outfitLoaded || !!outfitError) && (jakartaLoaded || !!jakartaError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#1967D2" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
