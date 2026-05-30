// eSIM activation helpers — everything the install screen needs to drive iOS
// deep-link install, render a local QR code, and share that QR image.
//
// All computed CLIENT-SIDE from `activationCode` + `smdpAddress` so we don't
// depend on the backend filling `appleInstallUrl` or `qrCodeUrl`.
//
// LPA string format (the universal eSIM payload):
//   LPA:1$<smdp-address>$<matching-id>[$<confirmation-code>]
//
// Apple's iOS 17.4+ universal install URL:
//   https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=<url-encoded-LPA>
import { Platform } from 'react-native';
import QRCode from 'qrcode';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const APPLE_UNIVERSAL_BASE = 'https://esimsetup.apple.com/esim_qrcode_provisioning';

/**
 * Build the canonical LPA activation string from whatever the backend gave us.
 *
 * Tolerates three shapes:
 *   1. Full LPA already: "LPA:1$smdp.example.com$ABCD-EFGH-IJKL"  → returned as-is
 *   2. Components separately: smdp="smdp.example.com", code="ABCD-EFGH-IJKL"  → assembled
 *   3. Just `code` already-formatted like "1$smdp$matching" (no LPA prefix)  → "LPA:" prepended
 *
 * Returns null if there isn't enough info to install.
 */
export function buildLpaString(
  smdp: string | null | undefined,
  activationCode: string | null | undefined,
): string | null {
  const code = String(activationCode || '').trim();
  const dp = String(smdp || '').trim();
  if (code.startsWith('LPA:')) return code;
  if (code.startsWith('1$') && code.includes('$', 2)) return `LPA:${code}`;
  if (dp && code) return `LPA:1$${dp}$${code}`;
  return null;
}

/**
 * Build the iOS one-tap install URL.
 *
 * iOS 17.4+: opens directly into Settings → Cellular → Set Up eSIM with the
 * SM-DP+ prefilled. Older iOS versions fall through to Safari (still works as
 * a manual hand-off).
 */
export function buildAppleUniversalUrl(lpa: string): string {
  return `${APPLE_UNIVERSAL_BASE}?carddata=${encodeURIComponent(lpa)}`;
}

/**
 * The right deeplink target for the current platform.
 *
 *   iOS     → Apple universal URL (opens iOS Settings → Add eSIM).
 *   Android → LPA: scheme URI (caught by Android Settings on API 28+).
 *   Web     → null; show the QR instead.
 *
 * Returning null signals "show greyed/disabled Activate" to the caller.
 */
export function buildActivationDeeplink(lpa: string): string | null {
  if (Platform.OS === 'ios') return buildAppleUniversalUrl(lpa);
  if (Platform.OS === 'android') return lpa; // already in LPA: format
  return null;
}

/** True when this platform supports a one-tap activation deeplink. */
export function isActivationSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/** @deprecated use isActivationSupported() — kept for compat with old call sites */
export function isAppleUniversalSupported(): boolean {
  return isActivationSupported();
}

/**
 * Generate a PNG data URL of the QR code for an LPA string, suitable for both
 * <Image source={{ uri }} /> and for sharing (after decoding to file).
 *
 * 600x600 with low margin — enough resolution that the QR is scannable when
 * the recipient zooms in on a small Image view.
 */
export async function generateQrDataUrl(lpa: string): Promise<string> {
  return QRCode.toDataURL(lpa, {
    width: 600,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

/**
 * Share the QR code as a PNG via the native share sheet (WhatsApp, Telegram,
 * AirDrop, Save Image, etc).
 *
 * Decodes the data URL to base64, writes to the OS cache directory, then hands
 * the file URI to expo-sharing. The temp file is small (~3KB) and the cache
 * is cleared by the OS eventually.
 *
 * Returns false when sharing isn't available (web, missing entitlement).
 */
export async function shareEsimQr(opts: {
  lpa: string;
  country: string;
  dataLabel?: string; // e.g. "5 GB · 30 days" — appended to the share title
}): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!(await Sharing.isAvailableAsync())) return false;
  const dataUrl = await generateQrDataUrl(opts.lpa);
  const base64 = dataUrl.split(',')[1] || '';
  if (!base64) return false;
  const filename = `tulip-esim-${opts.country.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
  const uri = (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '') + filename;
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: opts.dataLabel
      ? `Tulip eSIM — ${opts.country} (${opts.dataLabel})`
      : `Tulip eSIM — ${opts.country}`,
  });
  return true;
}
