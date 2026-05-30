// Thin UI for the eSIM install panel. All wiring is in useEsimInstallCard.
//
// Two-button layout per spec:
//   [Activate]  [QR]
//
//   "Activate" opens iOS Settings → Add eSIM (iPhone-only).
//   "QR"        toggles the QR image + a Share QR button so the user can
//               install on a different phone (or send to someone else via
//               WhatsApp / AirDrop / Save Image / etc.).
//
// Manual entry rows (SM-DP+ / activation code) live below for advanced users.
import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Smartphone, QrCode, Share2, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useEsimInstallCard } from './useEsimInstallCard';

type Props = {
  smdp: string | null | undefined;
  activationCode: string | null | undefined;
  country: string;
  dataLabel?: string;
};

function Row({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 12 }}>
      <Text style={{ fontSize: 13, color: t.fgMuted }}>{label}</Text>
      <Text selectable style={{ flex: 1, textAlign: 'right', fontSize: 12, color: t.fg, fontWeight: '600', fontFamily: t.font.bodyMedium }}>
        {value}
      </Text>
    </View>
  );
}

export function EsimInstallCard(props: Props) {
  const t = useTheme();
  const vm = useEsimInstallCard({
    smdp: props.smdp,
    activationCode: props.activationCode,
    country: props.country,
    dataLabel: props.dataLabel,
  });

  // Provider data missing — clear empty state (the "I bought it but nothing
  // installs" case). Backend's 31s retry + 30-min cron should make this rare.
  if (!vm.hasActivationData) {
    return (
      <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 18, gap: 10, ...t.shadow1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} color={t.warning} />
          <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg }}>
            Activation data unavailable
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: t.fgMuted, lineHeight: 18 }}>
          The provider hasn't returned the install code for this eSIM yet. Pull down to refresh, or contact support if it persists.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 18, gap: 14, ...t.shadow1 }}>
      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
        Install eSIM
      </Text>

      {/* Two buttons side-by-side: Activate (iOS deeplink) + QR (toggle reveal). */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {vm.showActivateButton && (
          <Pressable
            onPress={vm.activate}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: t.primary,
              borderRadius: t.radius.pill,
              paddingVertical: 12,
              opacity: pressed ? 0.85 : 1,
              ...t.shadowGlow,
            })}
          >
            <Smartphone size={16} color={t.onPrimary} strokeWidth={2.2} />
            <Text style={{ color: t.onPrimary, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14 }}>
              Activate
            </Text>
          </Pressable>
        )}
        {vm.showQrButton && (
          <Pressable
            onPress={vm.toggleQr}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: vm.qrRevealed ? t.bgSunken : 'transparent',
              borderWidth: 1.5,
              borderColor: vm.qrRevealed ? t.primary : t.border,
              borderRadius: t.radius.pill,
              paddingVertical: 12,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <QrCode size={16} color={vm.qrRevealed ? t.primary : t.fg} strokeWidth={2.2} />
            <Text style={{ color: vm.qrRevealed ? t.primary : t.fg, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14 }}>
              {vm.qrRevealed ? 'Hide QR' : 'QR'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* QR panel — only when user taps the QR button. */}
      {vm.qrRevealed && (
        <View style={{ alignItems: 'center', gap: 10, paddingTop: 4 }}>
          {vm.qrLoading ? (
            <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={t.primary} />
            </View>
          ) : vm.qrDataUrl ? (
            <>
              <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 16 }}>
                <Image
                  source={{ uri: vm.qrDataUrl }}
                  style={{ width: 220, height: 220 }}
                  contentFit="contain"
                  transition={120}
                />
              </View>
              <Text style={{ fontSize: 11, color: t.fgMuted, textAlign: 'center', paddingHorizontal: 8 }}>
                Scan with another phone's camera, or share to install on someone else's device.
              </Text>
              {vm.showShare && (
                <Pressable
                  onPress={vm.share}
                  disabled={vm.busy}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 9,
                    paddingHorizontal: 18,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: t.primary,
                    opacity: pressed || vm.busy ? 0.6 : 1,
                  })}
                >
                  <Share2 size={14} color={t.primary} strokeWidth={2.2} />
                  <Text style={{ color: t.primary, fontWeight: '700', fontSize: 13 }}>
                    {vm.busy ? 'Sharing…' : 'Share QR'}
                  </Text>
                </Pressable>
              )}
            </>
          ) : null}
        </View>
      )}

      {/* Manual entry — for the few users who prefer typing into iOS Settings. */}
      {(vm.smdp || vm.activationCodeManual) && (
        <View style={{ borderWidth: 1, borderColor: t.border, borderRadius: 12, overflow: 'hidden' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, padding: 12, paddingBottom: 0 }}>
            Manual entry
          </Text>
          {vm.smdp && <Row label="SM-DP+ address" value={vm.smdp} />}
          {vm.activationCodeManual && <Row label="Activation code" value={vm.activationCodeManual} />}
        </View>
      )}
    </View>
  );
}
