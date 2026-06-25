import { useCallback } from 'react';
import { useCurrencyStore } from '@/state/currencyStore';
import { formatAmount, type CurrencyMeta } from '@/data/currency';
import { roundIqd250 } from '@/lib/pricing';

/**
 * Canonical IQD sale price for a provider USD amount — this is exactly what FIB
 * charges (markup already baked in via the effective iqdPerUsd). Display in any
 * currency is just this IQD value divided by that currency's universal FX rate.
 */
function saleIqd(providerUsd: number, iqdPerUsd: number): number {
  return roundIqd250(providerUsd * iqdPerUsd);
}

function metaFor(currencies: CurrencyMeta[], code: string): CurrencyMeta | undefined {
  return currencies.find((c) => c.code === code) ?? currencies.find((c) => c.code === 'IQD');
}

/**
 * Formats a provider USD base amount in the user's selected display currency.
 * Anchored on the canonical IQD sale price (what is actually charged), then
 * converted via the universal FX rate (IQD per unit). IQD renders as the IQD
 * price itself; USD/EUR/… render the equivalent at the admin-set rate.
 *   const money = useMoney();
 *   <Text>{money(2)}</Text>   // "€4.19" / "$4.60" / "6,200 IQD"
 */
export function useMoney() {
  const code = useCurrencyStore((s) => s.code);
  const iqdPerUsd = useCurrencyStore((s) => s.iqdPerUsd);
  const fx = useCurrencyStore((s) => s.fx);
  const currencies = useCurrencyStore((s) => s.currencies);
  return useCallback(
    (providerUsd: number, saleIqdOverride?: number) => {
      const iqd = saleIqdOverride != null ? saleIqdOverride : saleIqd(providerUsd, iqdPerUsd);
      const meta = metaFor(currencies, code);
      if (!meta) return `${Math.round(iqd).toLocaleString('en-US')} IQD`;
      const rate = meta.code === 'IQD' ? 1 : fx[meta.code] || 1;
      return formatAmount(iqd / rate, meta);
    },
    [code, iqdPerUsd, fx, currencies],
  );
}

/**
 * The "≈ N,NNN IQD" note shown next to a foreign-currency price at the pay step,
 * because FIB always charges in IQD. Returns null when the display currency is
 * already IQD (no note needed).
 */
export function useIqdNote() {
  const code = useCurrencyStore((s) => s.code);
  const iqdPerUsd = useCurrencyStore((s) => s.iqdPerUsd);
  return useCallback(
    (providerUsd: number, saleIqdOverride?: number): string | null => {
      if (code === 'IQD') return null;
      const iqd = saleIqdOverride != null ? saleIqdOverride : saleIqd(providerUsd, iqdPerUsd);
      return `≈ ${Math.round(iqd).toLocaleString('en-US')} IQD`;
    },
    [code, iqdPerUsd],
  );
}
