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
  // Render gates — always rendered when we have activation data, but the
  // Activate button is disabled on non-iOS so the user clearly sees the
  // option exists and where it would go.
  hasActivationData: boolean;
  showActivateButton: boolean;  // true whenever we have an LPA
  activateEnabled: boolean;     // false on web / Android — Activate is iPhone-only
  activateDisabledReason: string | null; // shown under disabled Activate
  showQrButton: boolean;        // true whenever we have an LPA → QR can render
  qrRevealed: boolean;          // user tapped QR; show image + Share button
  showShare: boolean;           // sharing is available on this platform

  // Display
  qrDataUrl: string | null;     // PNG data URL for <Image source={{ uri }} />
  qrLoading: boolean;
  smdp: string | null;
  activationCodeManual: string | null;

  // Actions
  busy: boolean;
  activate: () => void;          // tap → iOS install sheet (no-op when disabled)
  toggleQr: () => void;          // tap → reveal/hide the QR
  share: () => Promise<void>;    // tap → native share sheet for QR PNG
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
  const [qrRevealed, setQrRevealed] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  // Generate the QR data URL lazily — only when the user taps "QR" (saves a
  // few ms on initial render and ensures users who only use Activate never
  // pay the cost). Cheap (~10ms), no native deps.
  useEffect(() => {
    if (!lpa || !qrRevealed || qrDataUrl) return;
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
  }, [lpa, qrRevealed, qrDataUrl]);

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

  const toggleQr = () => {
    if (!lpa) return;
    setQrRevealed((v) => !v);
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
    showQrButton: !!lpa,
    qrRevealed,
    showShare: Platform.OS !== 'web' && !!lpa,
    qrDataUrl,
    qrLoading,
    smdp: input.smdp ?? null,
    activationCodeManual: input.activationCode ?? null,
    busy,
    activate,
    toggleQr,
    share,
  };
}
