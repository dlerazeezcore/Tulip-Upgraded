import { useCallback } from 'react';
import { useCurrencyStore } from '@/state/currencyStore';
import { CURRENCIES, formatMoney } from '@/data/currency';

/**
 * Returns a formatter that converts a USD base amount into the user's selected
 * currency. IQD (the default) uses the live backend rate × markup so prices
 * always reflect the server-authoritative IQD price.
 *   const money = useMoney();
 *   <Text>{money(2)}</Text>   // "6,200 IQD"
 */
export function useMoney() {
  const code = useCurrencyStore((s) => s.code);
  const iqdPerUsd = useCurrencyStore((s) => s.iqdPerUsd);
  return useCallback(
    (usd: number) => {
      if (code === 'IQD') {
        return formatMoney(usd, { ...CURRENCIES.IQD, rate: iqdPerUsd });
      }
      return formatMoney(usd, CURRENCIES[code]);
    },
    [code, iqdPerUsd],
  );
}
