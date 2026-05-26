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
  // The provider returns many coverage/quality variants for the same data+duration
  // (e.g. ~9 "1GB/Day" options). Keep only the cheapest per (type, days, GB) so the
  // customer sees one clean option per size — collapses 100+ rows to ~20.
  const best = new Map<string, Bundle>();
  for (const p of packages) {
    if (!p?.packageCode) continue;
    const b = packageToBundle(p, placeId);
    if (b.days <= 0) continue;
    const key = `${b.type}-${b.days}-${b.gb}`;
    const cur = best.get(key);
    if (!cur || b.usd < cur.usd) best.set(key, b);
  }
  return [...best.values()].sort((a, b) => a.usd - b.usd);
}
