// Universal multi-currency display. The exchange RATE (IQD per 1 unit) is the
// shared/universal FX — it applies to every service, not just eSIM. Per-currency
// presentation + the live rates come from the backend `/api/v1/currencies` feed;
// these bundled defaults are only the offline fallback before that loads.
// (Markup/discount is a separate, service-scoped concern — see pricing rules.)

export type CurrencyCode = string;

export type CurrencyMeta = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
  position: 'prefix' | 'suffix';
  flag: string; // ISO-2 for the Flag component
  /** IQD per 1 unit of this currency (universal FX). IQD itself is 1. */
  rate: number;
  enabled: boolean;
};

/** Offline fallback used before the backend `/currencies` feed loads. */
export const DEFAULT_CURRENCIES: CurrencyMeta[] = [
  { code: 'IQD', symbol: 'IQD', name: 'Iraqi Dinar', decimals: 0, position: 'suffix', flag: 'IQ', rate: 1, enabled: true },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, position: 'prefix', flag: 'US', rate: 1500, enabled: true },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, position: 'prefix', flag: 'EU', rate: 1650, enabled: true },
];

/** Format a value that is ALREADY expressed in `meta`'s currency. */
export function formatAmount(value: number, meta: CurrencyMeta): string {
  const n =
    meta.decimals === 0
      ? Math.round(value).toLocaleString('en-US')
      : Number.isInteger(value)
        ? value.toLocaleString('en-US')
        : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return meta.position === 'prefix' ? `${meta.symbol}${n}` : `${n} ${meta.symbol}`;
}
