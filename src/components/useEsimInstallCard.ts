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
  showAppleInstallButton: boolean; // iOS only + LPA available
  showQr: boolean; // we computed a QR
  showShare: boolean; // sharing is available on this platform

  // Display
  qrDataUrl: string | null; // PNG data URL for <Image source={{ uri }} />
  qrLoading: boolean;
  smdp: string | null;
  activationCodeManual: string | null;

  // Actions
  busy: boolean;
  openInIphone: () => void; // tap → iOS one-tap install
  share: () => Promise<void>; // tap → native share sheet for QR PNG
  markInstalled: () => Promise<void>; // backend marker: "I've installed it"
};

type Input = {
  // Raw fields from the backend EsimProfile
  smdp: string | null | undefined;
  activationCode: string | null | undefined;
  country: string;
  dataLabel?: string;
  // Backend side-effect: marks the profile as installed in our DB
  onMarkInstalled?: () => Promise<void>;
};

export function useEsimInstallCard(input: Input): EsimInstallCardViewModel {
  const lpa = useMemo(
    () => buildLpaString(input.smdp, input.activationCode),
    [input.smdp, input.activationCode],
  );

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  // Generate the QR data URL whenever LPA changes. Cheap (~10ms), no native deps.
  useEffect(() => {
    if (!lpa) {
      setQrDataUrl(null);
      return;
    }
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
  }, [lpa]);

  const appleUrl = useMemo(() => (lpa ? buildAppleUniversalUrl(lpa) : null), [lpa]);

  const openInIphone = () => {
    if (!appleUrl) return;
    // Fire the backend "mark installed" side-effect optimistically; iOS sheet
    // covers the app so the user can't see the error toast anyway.
    if (input.onMarkInstalled) input.onMarkInstalled().catch(() => {});
    Linking.openURL(appleUrl).catch(() =>
      Alert.alert(
        'Could not open eSIM setup',
        "Open Settings → Cellular → Add eSIM and scan the QR code instead.",
      ),
    );
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

  const markInstalled = async () => {
    if (busy || !input.onMarkInstalled) return;
    setBusy(true);
    try {
      await input.onMarkInstalled();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return {
    hasActivationData: !!lpa,
    showAppleInstallButton: !!appleUrl && isAppleUniversalSupported(),
    showQr: !!qrDataUrl,
    showShare: Platform.OS !== 'web' && !!lpa,
    qrDataUrl,
    qrLoading,
    smdp: input.smdp ?? null,
    activationCodeManual: input.activationCode ?? null,
    busy,
    openInIphone,
    share,
    markInstalled,
  };
}
