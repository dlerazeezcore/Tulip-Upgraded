// Thin UI for the eSIM install panel. All wiring is in useEsimInstallCard.
import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Smartphone, Share2, Check, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useEsimInstallCard, type EsimInstallCardViewModel } from './useEsimInstallCard';

type Props = {
  smdp: string | null | undefined;
  activationCode: string | null | undefined;
  country: string;
  dataLabel?: string;
  alreadyInstalled?: boolean;
  onMarkInstalled?: () => Promise<void>;
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
  const vm: EsimInstallCardViewModel = useEsimInstallCard({
    smdp: props.smdp,
    activationCode: props.activationCode,
    country: props.country,
    dataLabel: props.dataLabel,
    onMarkInstalled: props.onMarkInstalled,
  });

  // Provider data missing — show a clear empty state instead of pretending the
  // user can install (this is the "I bought it and Activate did nothing" case).
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
          The provider hasn't returned the install code for this eSIM yet. This is usually
          temporary. Pull down to refresh, or contact support if it persists.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 18, gap: 14, ...t.shadow1 }}>
      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
        Install eSIM
      </Text>

      {/* iOS one-tap install — primary CTA on iPhone */}
      {vm.showAppleInstallButton && (
        <PrimaryButton
          label="Install on this iPhone"
          icon={<Smartphone size={16} color="#fff" strokeWidth={2.2} />}
          onPress={vm.openInIphone}
        />
      )}

      {/* QR — for scanning with another device's camera, or sharing */}
      {vm.qrLoading ? (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ActivityIndicator color={t.primary} />
        </View>
      ) : vm.showQr && vm.qrDataUrl ? (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 16 }}>
            <Image
              source={{ uri: vm.qrDataUrl }}
              style={{ width: 200, height: 200 }}
              contentFit="contain"
              transition={120}
            />
          </View>
          <Text style={{ fontSize: 11, color: t.fgMuted, textAlign: 'center' }}>
            Scan with another phone's camera, or share with someone to install on their device.
          </Text>
          {vm.showShare && (
            <Pressable
              onPress={vm.share}
              disabled={vm.busy}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 14,
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
        </View>
      ) : null}

      {/* Manual entry — for users who prefer to type it in */}
      {(vm.smdp || vm.activationCodeManual) && (
        <View style={{ borderWidth: 1, borderColor: t.border, borderRadius: 12, overflow: 'hidden' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, padding: 12, paddingBottom: 0 }}>
            Manual entry
          </Text>
          {vm.smdp && <Row label="SM-DP+ address" value={vm.smdp} />}
          {vm.activationCodeManual && <Row label="Activation code" value={vm.activationCodeManual} />}
        </View>
      )}

      {/* Secondary: "I've installed it" — backend marker for tracking */}
      {!props.alreadyInstalled && props.onMarkInstalled && (
        <Pressable
          onPress={vm.markInstalled}
          disabled={vm.busy}
          style={{ alignItems: 'center', paddingVertical: 10 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Check size={14} color={t.primary} strokeWidth={2.5} />
            <Text style={{ color: t.primary, fontWeight: '700', fontSize: 13 }}>
              {vm.busy ? 'Saving…' : "I've installed this eSIM"}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}
