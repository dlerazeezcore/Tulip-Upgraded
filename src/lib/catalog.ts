// Pure transforms between provider DTOs and the UI catalog shapes (no network).
import type { Bundle } from '@/data/esim';
import type { ProviderPackage } from '@/services/types';

const GB = 1024 * 1024 * 1024;

/** Map a provider package to a UI bundle card. Provider `price` is in 1/10000 USD. */
export function packageToBundle(p: ProviderPackage, placeId: string): Bundle {
  const bytes = p.volume ?? 0;
  const nameUnlimited = (p.name ?? '').toLowerCase().includes('unlimited');
  const unlimited = bytes <= 0 || nameUnlimited;
  const gb = unlimited ? null : Math.max(Math.round((bytes / GB) * 10) / 10, 0.1);
  const days = p.duration ?? 0;
  const providerPriceMinor = p.price ?? 0;
  return {
    id: p.packageCode,
    placeId,
    type: unlimited ? 'unlimited' : 'fixed',
    gb,
    days,
    usd: providerPriceMinor / 10000,
    packageCode: p.packageCode,
    providerPriceMinor,
    periodNum: days,
  };
}

export function packagesToBundles(packages: ProviderPackage[], placeId: string): Bundle[] {
  const seen = new Set<string>();
  const out: Bundle[] = [];
  for (const p of packages) {
    if (!p?.packageCode || seen.has(p.packageCode)) continue;
    seen.add(p.packageCode);
    out.push(packageToBundle(p, placeId));
  }
  return out.sort((a, b) => a.usd - b.usd);
}
