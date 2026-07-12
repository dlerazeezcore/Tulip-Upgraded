import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
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
import { light } from '@/theme/tokens';
import { useThemeStore } from '@/state/themeStore';
import { useCurrencyStore } from '@/state/currencyStore';
import { useAuthStore } from '@/state/authStore';
import { useEsimStore } from '@/state/esimStore';
import { useOrderStore } from '@/state/orderStore';
import { useTravelersStore } from '@/state/travelersStore';
import { useLocaleStore } from '@/state/localeStore';
import { useDeviceStore } from '@/state/deviceStore';
import { configureForegroundPushHandler, configureNotificationHandler, registerDevice } from '@/services/push';
import { UpdateAvailableModal } from '@/components/UpdateAvailableModal';
import { applySystemNavBar } from '@/lib/systemNavBar';
import '@/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});
// Set how foreground notifications display. Safe at module load (no-op on web).
configureNotificationHandler();
// Forward rn-firebase foreground messages to expo-notifications so iOS shows
// the banner when the app is open (iOS hides the banner by default in that
// state; this is the most common silent-failure mode for FCM on iOS).
configureForegroundPushHandler();

function ThemedStack() {
  const t = useTheme();
  // Keep the Android system navigation bar opaque + theme-coloured so it
  // reserves its own space and never overlays the bottom tab bar. Re-applies
  // on light/dark change. No-op on iOS/web.
  useEffect(() => {
    applySystemNavBar(t);
  }, [t.mode, t.bgElev]);
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
        <Stack.Screen name="admin/notifications/index" />
        <Stack.Screen name="admin/notifications/update" />
        <Stack.Screen name="admin/notifications/user" />
        <Stack.Screen name="admin/notifications/custom" />
        <Stack.Screen name="admin/notifications/history" />
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
  const hydrateDevice = useDeviceStore((s) => s.hydrate);
  // Stable scalar, not the user object: profile edits / notification toggles
  // replace the object reference and would re-fire the refresh effect below.
  const authKey = useAuthStore((s) => s.user?.id ?? null);
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
    hydrateDevice();
  }, [hydrate, hydrateCurrency, hydrateAuth, hydrateLocale, hydrateDevice]);

  // Trigger the iOS / Android notification permission prompt as early as
  // possible — on the FIRST screen, before login. The backend's register
  // endpoint accepts unauthenticated calls and stores the device as anonymous;
  // when the user later signs in, setSession() re-registers and the existing
  // device row (matched by token) is upserted to that user. This way:
  //   - Users get prompted once when they open the app for the first time.
  //   - Anonymous users (browsing without signing in) can still receive pushes.
  // Runs once locale has hydrated so the right `locale` is stamped on the row.
  useEffect(() => {
    if (!localeHydrated) return;
    registerDevice({ locale: useLocaleStore.getState().language }).catch(() => {});
  }, [localeHydrated]);

  // Load the signed-in user's eSIMs, orders and travelers whenever auth changes.
  useEffect(() => {
    refreshEsims();
    refreshOrders();
    refreshTravelers();
  }, [authKey, refreshEsims, refreshOrders, refreshTravelers]);

  // On web, font loading can occasionally fail or timeout; don't block initial render forever.
  const ready =
    (outfitLoaded || !!outfitError) && (jakartaLoaded || !!jakartaError) && hydrated && localeHydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) {
    // Pre-hydration splash: theme isn't resolved yet, so use light tokens.
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: light.bg }}>
        <ActivityIndicator size="large" color={light.primary} />
      </View>
    );
  }

  return (
    // initialMetrics: without it the provider renders null until the first
    // async native insets event, so the whole tree mounts a frame late and
    // pops down by the status-bar height on launch (Android 15 dispatches
    // window insets after first layout under enforced edge-to-edge).
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <ThemedStack />
        <UpdateAvailableModal />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
