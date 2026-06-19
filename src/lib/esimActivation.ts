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

// The Tulip petal mark (same artwork as src/components/TulipLogo.tsx), inlined
// as an SVG data URI so the shared/downloaded PNG can carry the centered logo
// without bundling a binary asset.
const TULIP_MARK_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200"><g transform="translate(3.8777622,-3.8778411)" fill="#1769c5">' +
      '<path d="M 474.40258,834.73284 C 433.64894,815.80857 388.13615,772.73147 367.69975,733.74034 343.78283,688.10868 339.40207,668.2112 339.62736,606.23483 c 0.22717,-62.49502 1.4905,-68.85153 48.79167,-245.49772 l 32.05657,-119.71526 16.96606,9.05699 c 26.6195,14.21026 29.31531,17.47112 31.91369,38.60293 4.87224,39.62456 17.69674,79.68844 60.66449,189.51655 55.94835,143.00728 58.04428,150.74153 58.04428,214.18888 0,52.02646 -3.40551,68.27921 -21.19244,101.14085 -12.72917,23.51739 -47.50243,53.93342 -61.65959,53.93342 -1.86903,0 -15.7333,-5.7279 -30.80951,-12.72863 z"/>' +
      '<path d="M 636.62481,842.77554 C 652.05237,810.4032 656.15914,786.262 653.70766,742.35557 650.0541,676.91996 636.5578,634.18891 575.34105,494.23675 529.65356,389.78718 513.95423,349.87643 513.95423,338.17946 c 0,-24.43945 39.20983,-72.25983 75.29438,-91.8292 l 17.74789,-9.62503 13.80988,8.54961 c 7.59543,4.70228 20.97835,14.56935 29.73981,21.92683 14.12037,11.85761 16.73064,16.50892 22.97847,40.94597 3.87668,15.16282 18.90084,62.46046 33.387,105.10589 43.68713,128.60937 50.84866,162.84951 47.15413,225.44942 -2.8541,48.35959 -12.87124,84.6041 -34.83794,126.05225 -14.16912,26.73522 -23.19358,38.26668 -49.2183,62.89122 -17.52732,16.58435 -33.82018,30.15334 -36.20633,30.15334 -2.87803,0 -1.92822,-5.05753 2.82159,-15.02422 z"/>' +
      '<path d="m 697.35202,833.46047 c 68.8364,-69.01288 94.52226,-136.80201 90.3459,-238.4375 -2.34418,-57.04731 -7.38808,-77.6461 -47.67901,-194.7159 -20.57954,-59.79611 -25.8704,-79.30438 -24.00769,-88.52046 3.6637,-18.12695 23.96369,-42.95373 47.79371,-58.45147 24.52863,-15.95206 25.04685,-15.71631 32.09468,14.59932 2.49803,10.74514 16.88521,63.73277 31.97147,117.75031 32.7662,117.32187 42.49846,169.08198 42.49946,226.02949 0.002,110.01228 -54.05839,190.01229 -156.15198,231.0783 -15.80806,6.35861 -30.75892,11.5611 -33.22412,11.5611 -2.46522,0 4.89569,-9.40195 16.35758,-20.89319 z"/>' +
      '</g></svg>',
  );

/** Promise-wrapped HTMLImageElement load (web only). */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Web-only: composite the Tulip petal mark on a white rounded badge in the
 * center of the QR PNG, mirroring the on-screen QR. Returns the original PNG
 * unchanged if anything fails — a cosmetic logo must never break share/download.
 */
async function compositeQrLogo(baseDataUrl: string, size: number): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return baseDataUrl;
  const qr = await loadImage(baseDataUrl);
  ctx.drawImage(qr, 0, 0, size, size);
  const badge = Math.round(size * 0.24);
  const logo = Math.round(size * 0.18);
  const bx = (size - badge) / 2;
  const by = (size - badge) / 2;
  const radius = Math.round(badge * 0.27);
  ctx.fillStyle = '#FFFFFF';
  if (typeof (ctx as any).roundRect === 'function') {
    ctx.beginPath();
    (ctx as any).roundRect(bx, by, badge, badge, radius);
    ctx.fill();
  } else {
    ctx.fillRect(bx, by, badge, badge);
  }
  const mark = await loadImage(TULIP_MARK_DATA_URI);
  ctx.drawImage(mark, (size - logo) / 2, (size - logo) / 2, logo, logo);
  return canvas.toDataURL('image/png');
}

/**
 * Generate a PNG data URL of the QR code for an LPA string, suitable for both
 * <Image source={{ uri }} /> and for sharing (after decoding to file).
 *
 * 600x600 with low margin — enough resolution that the QR is scannable when
 * the recipient zooms in on a small Image view. Error correction is `H` so the
 * centered Tulip mark (composited on web) doesn't stop the code from decoding.
 */
export async function generateQrDataUrl(lpa: string): Promise<string> {
  const base = await QRCode.toDataURL(lpa, {
    width: 600,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#FFFFFF' },
  });
  // The logo composite needs a DOM canvas — web download path only. Native
  // share keeps the plain (ecl:H) QR; never fail over a cosmetic overlay.
  if (Platform.OS !== 'web' || typeof document === 'undefined') return base;
  try {
    return await compositeQrLogo(base, 600);
  } catch {
    return base;
  }
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
