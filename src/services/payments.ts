// FIB payment wiring: create a payment, open the FIB app link, poll for status.
import { apiFetch } from '@/lib/api';
import type { FibPayment } from './types';

function normalize(res: any): FibPayment {
  return {
    paymentId: res?.paymentId || res?.providerPaymentId || res?.transactionId,
    status: String(res?.status || 'pending'),
    redirectUrl: res?.paymentLink || res?.personalAppLink || res?.redirectUrl || null,
    qrCode: res?.qrCodeUrl || res?.qrCode || null,
    readableCode: res?.readableCode || res?.providerInfo?.reference || null,
    expiresAt: res?.expiresAt || res?.validUntil || null,
    raw: res,
  };
}

export async function createFibPayment(input: {
  amount: number | string; // IQD amount
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<FibPayment> {
  const res = await apiFetch('/api/v1/payments/fib/create', {
    method: 'POST',
    body: {
      amount: input.amount,
      currency: input.currency ?? 'IQD',
      description: input.description,
      metadata: input.metadata ?? {},
    },
  });
  return normalize(res);
}

export async function getFibPaymentStatus(paymentId: string, refresh = true): Promise<FibPayment> {
  const res = await apiFetch(`/api/v1/payments/fib/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    query: { refresh },
  });
  return normalize(res);
}

const TERMINAL = new Set(['paid', 'failed', 'canceled', 'cancelled', 'expired', 'refunded']);

/** Poll the payment until it reaches a terminal state or times out.
 *  Pass `isCancelled` so a closed sheet / unmounted screen stops the loop
 *  instead of leaking a 3-minute background poll. */
export async function pollFibPayment(
  paymentId: string,
  opts: {
    intervalMs?: number;
    timeoutMs?: number;
    onTick?: (p: FibPayment) => void;
    isCancelled?: () => boolean;
  } = {},
): Promise<FibPayment> {
  const interval = opts.intervalMs ?? 3000;
  const deadline = Date.now() + (opts.timeoutMs ?? 180000);
  let last: FibPayment | null = null;
  while (Date.now() < deadline) {
    if (opts.isCancelled?.()) return last ?? { paymentId, status: 'pending' };
    last = await getFibPaymentStatus(paymentId, true);
    opts.onTick?.(last);
    if (TERMINAL.has(last.status.toLowerCase())) return last;
    await new Promise((r) => setTimeout(r, interval));
  }
  return last ?? { paymentId, status: 'pending' };
}

export function isPaid(p: FibPayment): boolean {
  return p.status.toLowerCase() === 'paid';
}

export type FibOutcome = 'paid' | 'cancelled' | 'failed' | 'expired' | 'timeout';

/** Classify a finished FIB poll so the UI can show the right message instead
 *  of a generic failure. A poll that ends without a terminal status (returns
 *  'pending') means we ran out of time — not that the user was declined. */
export function fibOutcome(p: FibPayment): FibOutcome {
  const s = p.status.toLowerCase();
  if (s === 'paid') return 'paid';
  if (s === 'canceled' || s === 'cancelled') return 'cancelled';
  if (s === 'failed' || s === 'refunded') return 'failed';
  if (s === 'expired') return 'expired';
  return 'timeout';
}

/** User-facing copy for a non-paid FIB outcome. */
export function fibOutcomeMessage(outcome: FibOutcome): string {
  switch (outcome) {
    case 'cancelled':
      return 'Payment was cancelled in the FIB app. Tap Pay to try again.';
    case 'failed':
      return 'FIB declined the payment. Check your FIB balance and tap Pay to try again.';
    case 'expired':
      return 'The payment request expired before it was approved. Tap Pay to start a new one.';
    case 'timeout':
      return "We couldn't confirm your payment in time. If you approved it in the FIB app, it'll appear shortly — pull down to refresh on the next screen. Otherwise tap Pay to try again.";
    case 'paid':
      return '';
  }
}
