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
import { useCurrencyStore } from '@/state/currencyStore';
import { useAuthStore } from '@/state/authStore';
import { useEsimStore } from '@/state/esimStore';
import { useOrderStore } from '@/state/orderStore';
import { useTravelersStore } from '@/state/travelersStore';
import { useLocaleStore } from '@/state/localeStore';
import '@/i18n';

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
        <Stack.Screen name="esim-store/index" />
        <Stack.Screen name="esim-store/[place]" />
        <Stack.Screen name="esim-store/checkout" />
        <Stack.Screen name="auth/sign-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/sign-up" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/forgot" options={{ presentation: 'modal' }} />
        <Stack.Screen name="orders/index" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="travelers/index" />
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="admin/users" />
        <Stack.Screen name="admin/notifications" />
        <Stack.Screen name="admin/currency" />
        <Stack.Screen name="admin/featured" />
        <Stack.Screen name="admin/orders" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const hydrate = useThemeStore((s) => s.hydrate);
  const hydrated = useThemeStore((s) => s.hydrated);
  const hydrateCurrency = useCurrencyStore((s) => s.hydrate);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const localeHydrated = useLocaleStore((s) => s.hydrated);
  const authUser = useAuthStore((s) => s.user);
  const refreshEsims = useEsimStore((s) => s.refresh);
  const refreshOrders = useOrderStore((s) => s.refresh);
  const refreshTravelers = useTravelersStore((s) => s.refresh);

  const [outfitLoaded, outfitError] = useOutfit({ Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold });
  const [jakartaLoaded, jakartaError] = useJakarta({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    hydrate();
    hydrateCurrency();
    hydrateAuth();
    hydrateLocale();
  }, [hydrate, hydrateCurrency, hydrateAuth, hydrateLocale]);

  // Load the signed-in user's eSIMs, orders and travelers whenever auth changes.
  useEffect(() => {
    refreshEsims();
    refreshOrders();
    refreshTravelers();
  }, [authUser, refreshEsims, refreshOrders, refreshTravelers]);

  // On web, font loading can occasionally fail or timeout; don't block initial render forever.
  const ready =
    (outfitLoaded || !!outfitError) && (jakartaLoaded || !!jakartaError) && hydrated && localeHydrated;

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
