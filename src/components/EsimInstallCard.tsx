// Thin UI for the eSIM install panel. All wiring is in useEsimInstallCard.
//
// Layout (top-to-bottom):
//   [Activate]                              ← iOS/Android one-tap deeplink;
//                                            greyed with caption on web.
//   <QR image — always visible when ready>  ← scan with another phone, or
//                                            share/download to install on
//                                            someone else's device.
//   [Share QR]   (native)   or
//   [Download QR PNG]   (web)
//   ---
//   MANUAL ENTRY
//     SM-DP+ address: …
//     Activation code: …
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import { Smartphone, Share2, Download, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useIsRTL } from '@/lib/rtl';
import { TulipLogo } from './TulipLogo';
import { useEsimInstallCard } from './useEsimInstallCard';

// react-native-qrcode-svg renders SVG primitives via react-native-svg — works
// on iOS, Android, AND web. The previous approach used qrcode.toDataURL which
// relies on canvas (browser-only). That's why the QR was blank on iOS even
// though it worked in our dev preview.

type Props = {
  smdp: string | null | undefined;
  activationCode: string | null | undefined;
  country: string;
  dataLabel?: string;
  /** Fires the moment the user taps Activate, before the iOS install sheet
   *  opens. Parent screen uses this to arm an AppState listener for
   *  refresh-on-return. */
  onActivateTapped?: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  const isRTL = useIsRTL();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 12 }}>
      <Text style={{ fontSize: 13, color: t.fgMuted }}>{label}</Text>
      <Text selectable style={{ flex: 1, textAlign: isRTL ? 'left' : 'right', fontSize: 12, color: t.fg, fontWeight: '600', fontFamily: t.font.bodyMedium }}>
        {value}
      </Text>
    </View>
  );
}

export function EsimInstallCard(props: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useEsimInstallCard({
    smdp: props.smdp,
    activationCode: props.activationCode,
    country: props.country,
    dataLabel: props.dataLabel,
    onActivateTapped: props.onActivateTapped,
  });

  if (!vm.hasActivationData) {
    return (
      <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: t.radius.card, padding: 18, gap: 10, ...t.shadow1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} color={t.warning} />
          <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg }}>
            {tr('install.unavailableTitle')}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: t.fgMuted, lineHeight: 18 }}>
          {tr('install.unavailableBody')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: t.radius.card, padding: 18, gap: 14, ...t.shadow1 }}>
      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
        {tr('install.installEsim')}
      </Text>

      {/* Activate — primary CTA. Always rendered; greyed on web. */}
      {vm.showActivateButton && (
        <>
          <Pressable
            onPress={vm.activate}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: vm.activateEnabled ? t.primary : t.bgSunken,
              borderRadius: t.radius.pill,
              paddingVertical: 13,
              opacity: pressed ? 0.85 : vm.activateEnabled ? 1 : 0.6,
              ...(vm.activateEnabled ? t.shadowGlow : {}),
            })}
          >
            <Smartphone size={16} color={vm.activateEnabled ? t.onPrimary : t.fgMuted} strokeWidth={2.2} />
            <Text style={{ color: vm.activateEnabled ? t.onPrimary : t.fgMuted, fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14 }}>
              {tr('install.activate')}
            </Text>
          </Pressable>
          {!vm.activateEnabled && vm.activateDisabledReason && (
            <Text style={{ fontSize: 11, color: t.fgMuted, textAlign: 'center', marginTop: -8 }}>
              {vm.activateDisabledReason}
            </Text>
          )}
        </>
      )}

      {/* QR — rendered via SVG, works on iOS / Android / web. */}
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
        <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: t.radius.card }}>
          {vm.lpa ? (
            // QR colors are intentionally hardcoded #fff/#000 — a scannable code
            // must be black-on-white regardless of light/dark theme.
            <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
              <QRCode value={vm.lpa} size={220} backgroundColor="#fff" color="#000" ecl="H" />
              {/* Tulip petal mark centered on a small white badge. ecl="H" gives
                  ~30% error correction, so the ~24% center occlusion still scans.
                  Pure-SVG overlay (TulipLogo) renders identically web + native. */}
              <View
                pointerEvents="none"
                style={{ position: 'absolute', width: 52, height: 52, borderRadius: t.radius.md, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
              >
                <TulipLogo size={38} />
              </View>
            </View>
          ) : (
            <View style={{ width: 220, height: 220 }} />
          )}
        </View>
        <Text style={{ fontSize: 11, color: t.fgMuted, textAlign: 'center', paddingHorizontal: 12 }}>
          {tr('install.scanHint')}
        </Text>
        {(vm.showShareButton || vm.showDownloadButton) && (
          <Pressable
            onPress={vm.showShareButton ? vm.share : vm.download}
            disabled={vm.busy || !vm.lpa}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 9,
              paddingHorizontal: 18,
              borderRadius: t.radius.pill,
              borderWidth: 1.5,
              borderColor: t.primary,
              opacity: pressed || vm.busy || !vm.lpa ? 0.6 : 1,
            })}
          >
            {vm.showShareButton ? (
              <Share2 size={14} color={t.primary} strokeWidth={2.2} />
            ) : (
              <Download size={14} color={t.primary} strokeWidth={2.2} />
            )}
            <Text style={{ color: t.primary, fontWeight: '700', fontSize: 13 }}>
              {vm.busy ? tr('install.working') : vm.showShareButton ? tr('install.shareQr') : tr('install.downloadQr')}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Manual entry — for users who type into iOS Settings. */}
      {(vm.smdp || vm.activationCodeManual) && (
        <View style={{ borderWidth: 1, borderColor: t.border, borderRadius: t.radius.md, overflow: 'hidden' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, padding: 12, paddingBottom: 0 }}>
            {tr('install.manualEntry')}
          </Text>
          {vm.smdp && <Row label={tr('install.smdp')} value={vm.smdp} />}
          {vm.activationCodeManual && <Row label={tr('install.activationCode')} value={vm.activationCodeManual} />}
        </View>
      )}
    </View>
  );
}
