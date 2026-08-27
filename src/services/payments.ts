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

/** Wait `ms`, or until `subscribe` fires — whichever comes first.
 *  The subscription is always torn down, including on the timeout path. */
function sleepUntil(ms: number, subscribe?: (wake: () => void) => () => void): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    // Declared with `let` BEFORE finish(): a subscriber that emits synchronously
    // on subscribe would otherwise hit the temporal dead zone on `unsubscribe`,
    // throw inside the executor, and leave this promise pending forever — a
    // poll loop that never ticks again.
    let unsubscribe: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (done) return;
      done = true;
      if (timer !== undefined) clearTimeout(timer);
      unsubscribe?.();
      resolve();
    };
    timer = setTimeout(finish, ms);
    unsubscribe = subscribe?.(finish);
    if (done) unsubscribe?.();
  });
}

/** Poll the payment until it reaches a terminal state or times out.
 *  Pass `isCancelled` so a closed sheet / unmounted screen stops the loop
 *  instead of leaking a 3-minute background poll.
 *
 *  `wakeOn` cuts the wait short. Paying happens in the FIB app, which means
 *  this loop spends the decisive moments backgrounded, where the OS throttles
 *  or suspends timers — an observed 3s interval stretched to 10s during the
 *  2026-08-25 incident, and the one poll that did land arrived two seconds
 *  before FIB flipped the payment to PAID. Waking on return turns "the user is
 *  back" into an immediate re-check instead of a wait on a throttled timer. */
export async function pollFibPayment(
  paymentId: string,
  opts: {
    intervalMs?: number;
    timeoutMs?: number;
    onTick?: (p: FibPayment) => void;
    isCancelled?: () => boolean;
    wakeOn?: (wake: () => void) => () => void;
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
    await sleepUntil(interval, opts.wakeOn);
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
