import { useCallback } from 'react';
import { useCurrencyStore } from '@/state/currencyStore';

/** Round an IQD amount to the nearest 250 dinars (matches the backend). */
export function roundIqd250(x: number): number {
  return Math.round(x / 250) * 250;
}

/** Convert a provider USD (B2B) amount to the consumer IQD price: rate × (1+markup%) then round-250. */
export function usdToIqd(usd: number, iqdPerUsd: number): number {
  return roundIqd250(usd * iqdPerUsd);
}

export function formatIqd(iqd: number): string {
  return `${Math.round(iqd).toLocaleString('en-US')} IQD`;
}

/**
 * eSIM prices are always shown in IQD (B2C): provider USD × backend rate × (1+markup%),
 * rounded to the nearest 250. Independent of the currency picker.
 */
export function useIqdMoney() {
  const iqdPerUsd = useCurrencyStore((s) => s.iqdPerUsd);
  return useCallback((usd: number) => formatIqd(usdToIqd(usd, iqdPerUsd)), [iqdPerUsd]);
}

/** Raw IQD integer (no formatting) for amounts sent to the backend / payment. */
export function useIqdAmount() {
  const iqdPerUsd = useCurrencyStore((s) => s.iqdPerUsd);
  return useCallback((usd: number) => usdToIqd(usd, iqdPerUsd), [iqdPerUsd]);
}
