// Multi-currency support. Base prices in the app are stored in USD;
// everything is converted at display time via useMoney().
// Rates are illustrative — swap for a live FX feed later.

export type CurrencyCode = 'USD' | 'EUR' | 'IQD';

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** Units of this currency per 1 USD. */
  rate: number;
  decimals: number;
  /** Where the symbol sits relative to the number. */
  position: 'prefix' | 'suffix';
  flag: string; // ISO-2 for the Flag component
};

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: 'USD', symbol: '$',   name: 'US Dollar',     rate: 1,    decimals: 2, position: 'prefix', flag: 'US' },
  EUR: { code: 'EUR', symbol: '€',   name: 'Euro',          rate: 0.92, decimals: 2, position: 'prefix', flag: 'EU' },
  IQD: { code: 'IQD', symbol: 'IQD', name: 'Iraqi Dinar',   rate: 1310, decimals: 0, position: 'suffix', flag: 'IQ' },
};

export const CURRENCY_LIST: Currency[] = [CURRENCIES.USD, CURRENCIES.EUR, CURRENCIES.IQD];

export function formatMoney(usd: number, cur: Currency): string {
  const value = usd * cur.rate;
  const n =
    cur.decimals === 0
      ? Math.round(value).toLocaleString('en-US')
      : (Number.isInteger(value)
          ? value.toLocaleString('en-US')
          : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  return cur.position === 'prefix' ? `${cur.symbol}${n}` : `${n} ${cur.symbol}`;
}
