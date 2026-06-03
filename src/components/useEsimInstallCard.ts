// Wiring for <EsimInstallCard /> — computes everything the install UI needs
// CLIENT-SIDE from the activation data the API returned, so we don't depend
// on the backend filling appleInstallUrl / qrCodeUrl.
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  buildActivationDeeplink,
  buildLpaString,
  generateQrDataUrl,
  isActivationSupported,
  shareEsimQr,
} from '@/lib/esimActivation';

export type EsimInstallCardViewModel = {
  // Render gates
  hasActivationData: boolean;
  showActivateButton: boolean;   // true whenever we have an LPA
  activateEnabled: boolean;      // false on web — Activate works on mobile only
  activateDisabledReason: string | null;
  showShareButton: boolean;      // true on native (uses share sheet)
  showDownloadButton: boolean;   // true on web (anchor-tag download)

  // Display — the LPA string goes straight into <QRCode value={lpa} />
  // (renders SVG cross-platform; doesn't depend on canvas).
  lpa: string | null;
  smdp: string | null;
  activationCodeManual: string | null;

  // Actions
  busy: boolean;
  activate: () => void;           // tap → mobile system eSIM install
  share: () => Promise<void>;     // tap → native share sheet for QR PNG
  download: () => Promise<void>;  // tap → web download of QR PNG
};

type Input = {
  // Raw fields from the backend EsimProfile
  smdp: string | null | undefined;
  activationCode: string | null | undefined;
  country: string;
  dataLabel?: string;
  /** Called the moment the user taps Activate, BEFORE we open iOS Settings.
   * The detail screen uses this to set up an AppState listener so it can
   * refresh + navigate home when the user returns from the iOS install flow. */
  onActivateTapped?: () => void;
};

export function useEsimInstallCard(input: Input): EsimInstallCardViewModel {
  const { t: tr } = useTranslation();
  const lpa = useMemo(
    () => buildLpaString(input.smdp, input.activationCode),
    [input.smdp, input.activationCode],
  );

  const [busy, setBusy] = useState<boolean>(false);

  // The QR image itself renders via <QRCode value={lpa} /> in the UI — no
  // pre-computation needed for display. We only generate the PNG data URL
  // on-demand for sharing or downloading, where we need an actual image file.
  // (qrcode.toDataURL uses canvas — works on web for download, but on iOS
  // native we'd hit the same blank-image bug. So sharing on iOS captures the
  // rendered SVG separately.)

  // Platform-aware deeplink: iOS → Apple universal URL,
  // Android → LPA: scheme URI, Web → null (button disabled).
  const activationUrl = useMemo(
    () => (lpa ? buildActivationDeeplink(lpa) : null),
    [lpa],
  );
  const activateEnabled = !!activationUrl && isActivationSupported();
  const activateDisabledReason = activateEnabled
    ? null
    : Platform.OS === 'web'
    ? tr('install.webReason')
    : tr('install.deviceReason');

  const activate = () => {
    if (!activateEnabled || !activationUrl) {
      Alert.alert(tr('install.openOnPhoneTitle'), tr('install.openOnPhoneBody'));
      return;
    }
    // Notify the parent screen BEFORE we open iOS Settings so it can arm an
    // AppState listener. When the user returns from the system install flow,
    // the screen calls refreshUsage() and navigates home.
    input.onActivateTapped?.();
    // iOS:    iOS Settings → Cellular → Add eSIM with SM-DP+ prefilled.
    // Android: System eSIM setup intent (Android 9 / API 28+). Older Android
    // or devices without an eSIM handler will reject the LPA: deeplink — fall
    // back to the always-visible QR + manual-entry panel below.
    Linking.openURL(activationUrl).catch(() =>
      Alert.alert(
        tr('install.couldNotOpenTitle'),
        Platform.OS === 'android' ? tr('install.couldNotOpenAndroid') : tr('install.couldNotOpenIos'),
      ),
    );
  };

  /** Web-only: download the QR as PNG. Generates the data URL on demand. */
  const download = async () => {
    if (Platform.OS !== 'web' || !lpa) return;
    if (busy) return;
    setBusy(true);
    try {
      const dataUrl = await generateQrDataUrl(lpa);
      const a = document.createElement('a');
      a.href = dataUrl;
      const stamp = Date.now();
      a.download = `tulip-esim-${(input.country || 'plan').toLowerCase().replace(/\s+/g, '-')}-${stamp}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // browser may block; ignore
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!lpa) return;
    if (busy) return;
    setBusy(true);
    try {
      const ok = await shareEsimQr({
        lpa,
        country: input.country,
        dataLabel: input.dataLabel,
      });
      if (!ok && Platform.OS !== 'web') {
        Alert.alert(tr('install.sharingUnavailableTitle'), tr('install.sharingUnavailable'));
      }
    } catch (e: any) {
      Alert.alert(tr('install.couldNotShare'), e?.message || tr('common.tryAgain'));
    } finally {
      setBusy(false);
    }
  };

  return {
    hasActivationData: !!lpa,
    showActivateButton: !!lpa,
    activateEnabled,
    activateDisabledReason,
    showShareButton: Platform.OS !== 'web' && !!lpa,
    showDownloadButton: Platform.OS === 'web' && !!lpa,
    lpa,
    smdp: input.smdp ?? null,
    activationCodeManual: input.activationCode ?? null,
    busy,
    activate,
    share,
    download,
  };
}
