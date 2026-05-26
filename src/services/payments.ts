// FIB payment wiring: create a payment, open the FIB app link, poll for status.
import { apiFetch } from '@/lib/api';
import type { FibPayment } from './types';

function normalize(res: any): FibPayment {
  return {
    paymentId: res?.paymentId || res?.providerPaymentId || res?.transactionId,
    status: String(res?.status || 'pending'),
    redirectUrl: res?.paymentLink || res?.personalAppLink || res?.redirectUrl || null,
    qrCode: res?.qrCodeUrl || res?.qrCode || null,
    readableCode: res?.readableCode || null,
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

/** Poll the payment until it reaches a terminal state or times out. */
export async function pollFibPayment(
  paymentId: string,
  opts: { intervalMs?: number; timeoutMs?: number; onTick?: (p: FibPayment) => void } = {},
): Promise<FibPayment> {
  const interval = opts.intervalMs ?? 3000;
  const deadline = Date.now() + (opts.timeoutMs ?? 180000);
  let last: FibPayment | null = null;
  while (Date.now() < deadline) {
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
