// THIN UI for the FIB payment sheet. Wiring lives in
// src/screens/payment/useFibPayment.ts — this file only renders the QR, the
// "pay by phone" deeplink button (mobile only) and the live payment status.
import React from 'react';
import { Modal, View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Smartphone, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { FibPaymentSheetVM } from '@/screens/payment/useFibPayment';

export function FibPaymentSheet({ sheet }: { sheet: FibPaymentSheetVM }) {
  const t = useTheme();

  return (
    <Modal visible={sheet.visible} transparent animationType="fade" onRequestClose={sheet.close}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', padding: 24, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: '100%', maxWidth: 420, backgroundColor: t.bgElev, borderRadius: t.radius.lg, padding: 22, gap: 14, alignItems: 'center', ...t.shadow2 }}>
          {/* Title + close */}
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
            <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg, letterSpacing: -0.4 }}>
              {sheet.title}
            </Text>
            <Pressable
              onPress={sheet.close}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={sheet.closeLabel}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} color={t.fg} />
            </Pressable>
          </View>

          {/* QR — FIB's official image preferred; fall back to drawing the deeplink. */}
          <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 16 }}>
            <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
              {sheet.qrUri ? (
                <Image source={{ uri: sheet.qrUri }} style={{ width: 220, height: 220 }} resizeMode="contain" />
              ) : sheet.fallbackQrValue ? (
                // Scannable codes must be black-on-white regardless of theme.
                <QRCode value={sheet.fallbackQrValue} size={220} backgroundColor="#fff" color="#000" ecl="H" />
              ) : (
                <ActivityIndicator color="#000" />
              )}
            </View>
          </View>

          <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center', fontFamily: t.font.body, lineHeight: 19 }}>
            {sheet.scanHint}
          </Text>

          {sheet.readableCode ? (
            <Text style={{ fontSize: 13, color: t.fg, fontFamily: t.font.bodyMedium, letterSpacing: 1 }}>
              {sheet.codeLabel}: {sheet.readableCode}
            </Text>
          ) : null}

          {/* Pay by phone — mobile only; opens this payment's deeplink. */}
          {sheet.canPayByPhone ? (
            <>
              <Text style={{ fontSize: 12, color: t.fgFaint, fontFamily: t.font.body }}>{sheet.orLabel}</Text>
              <Pressable
                onPress={sheet.payByPhone}
                style={({ pressed }) => ({
                  flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', width: '100%',
                  backgroundColor: t.primary, borderRadius: t.radius.pill, paddingVertical: 12,
                  opacity: pressed ? 0.85 : 1, ...t.shadowGlow,
                })}
              >
                <Smartphone size={16} color={t.onPrimary} strokeWidth={2.2} />
                <Text style={{ color: t.onPrimary, fontWeight: '700', fontFamily: t.font.displayMedium }}>
                  {sheet.payByPhoneLabel}
                </Text>
              </Pressable>
            </>
          ) : null}

          {/* Status: spinner while waiting; outcome message + retry otherwise. */}
          {sheet.statusMessage ? (
            <>
              <Text style={{ fontSize: 12, color: t.danger, textAlign: 'center', lineHeight: 18 }}>
                {sheet.statusMessage}
              </Text>
              <Pressable
                onPress={sheet.retry}
                style={({ pressed }) => ({
                  width: '100%', borderWidth: 1.5, borderColor: t.border, borderRadius: t.radius.pill,
                  paddingVertical: 12, alignItems: 'center', opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: t.fg, fontWeight: '600', fontFamily: t.font.displayMedium }}>
                  {sheet.retryLabel}
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <ActivityIndicator color={t.primary} size="small" />
              <Text style={{ fontSize: 13, color: t.fgMuted, fontFamily: t.font.body }}>{sheet.waitingLabel}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
