// THIN UI — wiring lives in src/screens/payment/usePaymentResult.ts. This route
// catches the FIB return deep link (tulip://payment/result) and bounces the
// user back to their in-progress payment sheet; it only ever flashes a spinner.
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useTheme } from '@/theme/ThemeContext';
import { usePaymentResult } from '@/screens/payment/usePaymentResult';

export default function PaymentResult() {
  const t = useTheme();
  const { message, redirectHome } = usePaymentResult();
  // Cold start into the deep link — nothing to pop back to. <Redirect> defers
  // until the navigator is ready, unlike an imperative replace from an effect.
  if (redirectHome) return <Redirect href="/(tabs)" />;
  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
        <ActivityIndicator size="large" color={t.primary} />
        <Text style={{ fontSize: 14, color: t.fgMuted, fontFamily: t.font.body, textAlign: 'center' }}>
          {message}
        </Text>
      </View>
    </ScreenSafeArea>
  );
}
