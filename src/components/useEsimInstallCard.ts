// Wiring for <EsimInstallCard /> — computes everything the install UI needs
// CLIENT-SIDE from the activation data the API returned, so we don't depend
// on the backend filling appleInstallUrl / qrCodeUrl.
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
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

  // Display
  qrDataUrl: string | null;      // PNG data URL — always generated when LPA exists
  qrLoading: boolean;
  smdp: string | null;
  activationCodeManual: string | null;

  // Actions
  busy: boolean;
  activate: () => void;           // tap → mobile system eSIM install
  share: () => Promise<void>;     // tap → native share sheet for QR PNG
  download: () => void;           // tap → web download of QR PNG
};

type Input = {
  // Raw fields from the backend EsimProfile
  smdp: string | null | undefined;
  activationCode: string | null | undefined;
  country: string;
  dataLabel?: string;
};

export function useEsimInstallCard(input: Input): EsimInstallCardViewModel {
  const lpa = useMemo(
    () => buildLpaString(input.smdp, input.activationCode),
    [input.smdp, input.activationCode],
  );

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  // Generate the QR data URL eagerly when activation data exists. The previous
  // tap-to-reveal pattern confused users — they tapped "QR" and saw nothing
  // (loading) and assumed it was broken. Showing the QR by default makes it
  // obvious. Cost: ~10ms of CPU + ~15KB of memory per detail screen, both
  // negligible.
  useEffect(() => {
    if (!lpa || qrDataUrl) return;
    let cancelled = false;
    setQrLoading(true);
    generateQrDataUrl(lpa)
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      })
      .finally(() => {
        if (!cancelled) setQrLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lpa, qrDataUrl]);

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
    ? 'Open the app on your phone to install — or scan the QR'
    : 'Use the QR to install on this device';

  const activate = () => {
    if (!activateEnabled || !activationUrl) {
      Alert.alert(
        'Open Tulip on your phone',
        'Activate works on iPhone or Android. Open this eSIM from the app on your phone — or tap QR and scan it from another phone.',
      );
      return;
    }
    // iOS:    iOS Settings → Cellular → Add eSIM with SM-DP+ prefilled.
    // Android: System eSIM setup intent (Android 9 / API 28+).
    // In both cases the system takes over the screen; user finishes there.
    // We detect completion via the cron's 30-min provider sync OR pull-to-refresh.
    Linking.openURL(activationUrl).catch(() =>
      Alert.alert(
        'Could not open eSIM setup',
        "Tap QR instead — scan it with another phone or share to install elsewhere.",
      ),
    );
  };

  /** Web-only: trigger an anchor-tag download of the QR PNG. */
  const download = () => {
    if (Platform.OS !== 'web' || !qrDataUrl) return;
    try {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      const stamp = Date.now();
      a.download = `tulip-esim-${(input.country || 'plan').toLowerCase().replace(/\s+/g, '-')}-${stamp}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore — browser will block automation if it must
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
        Alert.alert('Sharing unavailable', 'Could not open the share sheet on this device.');
      }
    } catch (e: any) {
      Alert.alert('Could not share', e?.message || 'Try again in a moment.');
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
    qrDataUrl,
    qrLoading,
    smdp: input.smdp ?? null,
    activationCodeManual: input.activationCode ?? null,
    busy,
    activate,
    share,
    download,
  };
}
