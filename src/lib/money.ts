import { useCallback } from 'react';
import { useCurrencyStore } from '@/state/currencyStore';
import { CURRENCIES, formatMoney } from '@/data/currency';

/**
 * Returns a formatter that converts a USD base amount into the
 * user's selected currency. Usage:
 *   const money = useMoney();
 *   <Text>{money(720)}</Text>   // "$720" / "€662" / "943,200 IQD"
 */
export function useMoney() {
  const code = useCurrencyStore((s) => s.code);
  return useCallback((usd: number) => formatMoney(usd, CURRENCIES[code]), [code]);
}
