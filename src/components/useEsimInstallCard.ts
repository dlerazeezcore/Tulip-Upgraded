// Wiring for <EsimInstallCard /> — computes everything the install UI needs
// CLIENT-SIDE from the activation data the API returned, so we don't depend
// on the backend filling appleInstallUrl / qrCodeUrl.
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import {
  buildAppleUniversalUrl,
  buildLpaString,
  generateQrDataUrl,
  isAppleUniversalSupported,
  shareEsimQr,
} from '@/lib/esimActivation';

export type EsimInstallCardViewModel = {
  // Render gates
  hasActivationData: boolean;
  showActivateButton: boolean; // iOS only + LPA available — opens iOS install sheet
  showQrButton: boolean;       // we have an LPA → can render a QR
  qrRevealed: boolean;         // user tapped QR button; show the image + share button
  showShare: boolean;          // sharing is available on this platform (always with QR)

  // Display
  qrDataUrl: string | null;    // PNG data URL for <Image source={{ uri }} />
  qrLoading: boolean;
  smdp: string | null;
  activationCodeManual: string | null;

  // Actions
  busy: boolean;
  activate: () => void;         // tap → iOS one-tap install sheet
  toggleQr: () => void;         // tap → reveal/hide the QR
  share: () => Promise<void>;   // tap → native share sheet for QR PNG
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

  const appleUrl = useMemo(() => (lpa ? buildAppleUniversalUrl(lpa) : null), [lpa]);

  const activate = () => {
    if (!appleUrl) return;
    // Opens iOS Settings → Cellular → Add eSIM with the SM-DP+ prefilled.
    // iOS takes over the screen; the user finishes the install there. We
    // detect that completion later via the cron's periodic provider sync.
    Linking.openURL(appleUrl).catch(() =>
      Alert.alert(
        'Could not open eSIM setup',
        "Tap the QR button instead — scan it with another phone, or share to install on a different device.",
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
    showActivateButton: !!appleUrl && isAppleUniversalSupported(),
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
