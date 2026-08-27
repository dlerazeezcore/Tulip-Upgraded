// Wiring for the FIB payment sheet. Owns the created payment, the QR, the
// "pay by phone" deeplink, live status polling (with cancellation on close /
// unmount) and the terminal outcome. The thin <FibPaymentSheet> renders the
// returned `sheet` view-model; checkout / top-up call `start()` and run their
// own `onPaid` (place order / apply top-up) once FIB confirms the charge.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createFibPayment, pollFibPayment, fibOutcome } from '@/services/payments';
import type { FibPayment } from '@/services/types';

export type FibSheetStatus =
  | 'waiting'
  // Charge confirmed, order being placed. A distinct state so the sheet stops
  // saying "waiting for your confirmation in the FIB app" (and stops counting
  // down to expiry) for the second or two that provisioning takes.
  | 'confirming'
  | 'paid'
  | 'cancelled'
  | 'failed'
  | 'expired'
  | 'timeout'
  // Charge confirmed by FIB, but placing the order afterwards failed. Distinct
  // from 'failed' so we never tell a paying user their payment failed.
  | 'bookingFailed';

export type FibCreateArgs = {
  amount: number | string;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
};

export type FibPaymentSheetVM = {
  visible: boolean;
  status: FibSheetStatus;
  /** Normalized data-URI / URL for FIB's official QR image (preferred). */
  qrUri: string | null;
  /** Per-payment deeplink, used to draw a QR when FIB sent no image. */
  fallbackQrValue: string | null;
  readableCode: string | null;
  isWeb: boolean;
  canPayByPhone: boolean;
  /** Localized message for a non-paid terminal outcome (else null). */
  statusMessage: string | null;
  /** Tone of the terminal outcome — only true failures read as danger. */
  statusTone: 'danger' | 'warning' | 'neutral' | null;
  /** Localized "expires in mm:ss" countdown while waiting (null if unknown). */
  expiresInLabel: string | null;
  title: string;
  scanHint: string;
  payByPhoneLabel: string;
  orLabel: string;
  waitingLabel: string;
  codeLabel: string;
  closeLabel: string;
  retryLabel: string;
  /** Label for the manual "I've paid — check now" action shown while waiting. */
  checkNowLabel: string;
  /** True while the sheet is waiting and a manual re-check is worth offering. */
  canCheckNow: boolean;
  payByPhone: () => void;
  close: () => void;
  retry: () => void;
  /** Re-check THIS payment. Never creates another one — see checkNow. */
  checkNow: () => void;
};

/** States that mean "not confirmed YET" rather than a real outcome. Returning
 *  to the app, or tapping check-now, resumes polling from any of these. */
const RECOVERABLE_STATUSES = new Set<FibSheetStatus>(['waiting', 'timeout']);

/** How long to keep watching one payment: until FIB says it expires, clamped so
 *  a missing or absurd expiry can never mean "poll forever" or "give up now". */
function pollWindowMsFor(p: FibPayment): number {
  const expiry = p.expiresAt ? Date.parse(p.expiresAt) : NaN;
  if (!Number.isFinite(expiry)) return 180000;
  // A little grace past expiry: FIB can settle a just-in-time payment
  // fractionally after the deadline, and stopping first strands that customer.
  return Math.min(20 * 60 * 1000, Math.max(60000, expiry - Date.now() + 15000));
}

/** Pass through data:/http(s) as-is; treat anything else as raw base64 PNG. */
function normalizeQrUri(qr: string | null | undefined): string | null {
  if (!qr) return null;
  const s = qr.trim();
  if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://')) return s;
  return `data:image/png;base64,${s}`;
}

export function useFibPayment() {
  const { t: tr } = useTranslation();
  const [payment, setPayment] = useState<FibPayment | null>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<FibSheetStatus>('waiting');
  const cancelledRef = useRef(false);
  const onPaidRef = useRef<null | ((p: FibPayment) => void | Promise<void>)>(null);
  const lastArgsRef = useRef<FibCreateArgs | null>(null);
  // The confirmed payment, kept so a post-payment booking failure can be retried
  // WITHOUT creating (and charging) a second FIB payment.
  const paidPaymentRef = useRef<FibPayment | null>(null);
  // Single-flight guard: exactly one poll loop at a time, so the
  // restart-on-foreground below can be fired freely without stacking loops.
  const pollingRef = useRef(false);
  // The charge has been handled (order placed, or booking failed after a
  // confirmed charge). Guarantees onPaid runs at most once even if a restarted
  // loop and the original one both observe PAID.
  const settledRef = useRef(false);

  // Stop any in-flight poll if the screen unmounts mid-payment.
  useEffect(() => () => { cancelledRef.current = true; }, []);

  // Live countdown to the payment's expiry (when FIB exposes one). Ticks every
  // second only while the sheet is visibly waiting; the interval is cleared on
  // close/unmount and whenever the payment or status changes.
  const [expiresLeftSec, setExpiresLeftSec] = useState<number | null>(null);
  const expiresAt = payment?.expiresAt ?? null;
  useEffect(() => {
    const target = expiresAt ? Date.parse(expiresAt) : NaN;
    if (!visible || status !== 'waiting' || Number.isNaN(target)) {
      setExpiresLeftSec(null);
      return;
    }
    const tick = () => setExpiresLeftSec(Math.max(0, Math.round((target - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [visible, status, expiresAt]);

  // Paying takes the user out to the FIB app, so the poll below spends the
  // decisive seconds backgrounded — where the OS throttles or suspends its
  // timer. Re-check the moment they come back rather than waiting out an
  // interval that may have stretched from 3s to 10s or stopped entirely.
  const wakeOnForeground = useCallback((wake: () => void) => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') wake();
    });
    return () => sub.remove();
  }, []);

  const runPoll = useCallback(async (p: FibPayment) => {
    // One loop at a time. The foreground restart below can fire on every
    // AppState change, so this is what keeps it idempotent.
    if (pollingRef.current || settledRef.current) return;
    pollingRef.current = true;
    cancelledRef.current = false;
    setStatus('waiting');
    let final: FibPayment;
    try {
      final = await pollFibPayment(p.paymentId, {
        // Watch until FIB's own expiry rather than an arbitrary 3 minutes. A
        // bank app with a PIN and an OTP routinely takes longer than that, and
        // timing out on a customer who is about to pay produced a scary
        // "we couldn't confirm your payment" on a charge that then succeeded.
        timeoutMs: pollWindowMsFor(p),
        isCancelled: () => cancelledRef.current,
        wakeOn: wakeOnForeground,
      });
    } finally {
      // Released even on throw, so a failed poll can be restarted rather than
      // wedging the sheet on "waiting" with nothing able to run again.
      pollingRef.current = false;
    }
    const oc = fibOutcome(final);
    // Always honor a confirmed payment — even if the sheet was just closed —
    // so the user never pays without getting the order placed.
    if (oc === 'paid') {
      if (settledRef.current) return;
      settledRef.current = true;
      paidPaymentRef.current = final;
      // Flip the sheet BEFORE the order round-trip: placing the order, two
      // cache refreshes and a navigation take a couple of seconds, and showing
      // the pay-in-FIB spinner through all of it reads as "nothing happened"
      // on a charge that has already gone through.
      setStatus('confirming');
      const cb = onPaidRef.current;
      if (cb) {
        // The charge is confirmed. If booking now fails we must NOT report a
        // generic failure (which reads as "payment failed") — surface a distinct
        // state so the user knows the money went through and can retry the
        // booking (or contact support) without paying twice.
        try {
          await cb(final);
        } catch {
          setStatus('bookingFailed');
          return;
        }
      }
      setVisible(false);
      setStatus('paid');
      return;
    }
    // A cancelled loop stops silently — but it must NOT leave the sheet stuck on
    // "waiting" forever with nothing running. Returning from the FIB app used to
    // land exactly here: the loop was dead, no status was set, and the sheet
    // span forever (2026-08-27). The foreground effect below restarts it; this
    // early return only skips the status write.
    if (cancelledRef.current) return;
    setStatus(oc);
  }, [wakeOnForeground]);

  // THE fix for "paid in FIB, came back, sheet never went away".
  //
  // The old design leaned on ONE long-lived await chain surviving a background
  // transition plus the tulip://payment/result deep link landing a route under
  // an open Modal. It does not survive: production logs show the app returning
  // to the foreground twice after a confirmed payment without issuing a single
  // status request, leaving the sheet spinning on a charge that had already
  // gone through.
  //
  // So do not depend on the loop surviving. Whenever the app comes back and the
  // sheet is still waiting, start a fresh one. pollingRef makes that a no-op
  // when the original loop is in fact alive, and settledRef keeps onPaid
  // exactly-once across both.
  useEffect(() => {
    if (!visible || !RECOVERABLE_STATUSES.has(status) || !payment) return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      // Coming back from the FIB app is not a cancellation — whatever killed
      // the previous loop, the user is here and the payment is still open.
      cancelledRef.current = false;
      void runPoll(payment);
    });
    return () => sub.remove();
  }, [visible, status, payment, runPoll]);

  /** "I've paid — check now". The manual escape hatch: re-checks THIS payment
   *  and never creates another one (unlike retry, which mints a new checkout).
   *  Insurance for the case where even the foreground restart misses. */
  const checkNow = useCallback(() => {
    if (!payment) return;
    cancelledRef.current = false;
    void runPoll(payment);
  }, [payment, runPoll]);

  const start = useCallback(
    async (args: FibCreateArgs, opts: { onPaid: (p: FibPayment) => void | Promise<void> }) => {
      lastArgsRef.current = args;
      onPaidRef.current = opts.onPaid;
      cancelledRef.current = false;
      settledRef.current = false;
      const p = await createFibPayment(args);
      setPayment(p);
      setVisible(true);
      await runPoll(p);
    },
    [runPoll],
  );

  // "Try again" creates a brand-new FIB payment (new paymentId + deeplink + QR)
  // — EXCEPT after a confirmed charge whose booking failed, where it re-attempts
  // the booking with the SAME payment so the user is never charged twice.
  const retry = useCallback(async () => {
    if (status === 'bookingFailed' && paidPaymentRef.current) {
      const cb = onPaidRef.current;
      if (!cb) return;
      setStatus('waiting');
      try {
        await cb(paidPaymentRef.current);
        setVisible(false);
        setStatus('paid');
      } catch {
        setStatus('bookingFailed');
      }
      return;
    }
    const args = lastArgsRef.current;
    if (!args) return;
    try {
      // A brand-new checkout is a brand-new charge to settle.
      settledRef.current = false;
      const p = await createFibPayment(args);
      setPayment(p);
      await runPoll(p);
    } catch {
      setStatus('failed');
    }
  }, [runPoll, status]);

  const close = useCallback(() => {
    cancelledRef.current = true;
    setVisible(false);
  }, []);

  const payByPhone = useCallback(() => {
    const url = payment?.redirectUrl;
    if (url) Linking.openURL(url).catch(() => {});
  }, [payment]);

  const isWeb = Platform.OS === 'web';
  const qrUri = normalizeQrUri(payment?.qrCode);
  // 'confirming' is a success in progress, not an outcome — excluding it here
  // is what stops the sheet flashing an error on a charge that just landed.
  const isTerminalNonPaid =
    status !== 'waiting' && status !== 'paid' && status !== 'confirming';
  // Only a decline/refund is a true failure. Cancelled is the user's own
  // action (neutral); expired / timeout / bookingFailed are recoverable
  // situations, not "your payment failed" (warning).
  const statusTone: FibPaymentSheetVM['statusTone'] = !isTerminalNonPaid
    ? null
    : status === 'failed'
      ? 'danger'
      : status === 'cancelled'
        ? 'neutral'
        : 'warning';
  const mm = expiresLeftSec != null ? String(Math.floor(expiresLeftSec / 60)).padStart(2, '0') : '';
  const ss = expiresLeftSec != null ? String(expiresLeftSec % 60).padStart(2, '0') : '';

  const sheet: FibPaymentSheetVM = {
    visible,
    status,
    qrUri,
    fallbackQrValue: payment?.redirectUrl ?? null,
    readableCode: payment?.readableCode ?? null,
    isWeb,
    canPayByPhone: !isWeb && !!payment?.redirectUrl,
    statusMessage: isTerminalNonPaid
      ? tr(`checkout.fib${status.charAt(0).toUpperCase()}${status.slice(1)}`)
      : null,
    statusTone,
    expiresInLabel:
      expiresLeftSec != null ? tr('checkout.fibExpiresIn', { time: `${mm}:${ss}` }) : null,
    title: tr('checkout.fibPayTitle'),
    scanHint: tr('checkout.fibScanHint'),
    payByPhoneLabel: tr('checkout.fibPayByPhone'),
    orLabel: tr('checkout.fibOr'),
    waitingLabel:
      status === 'confirming' ? tr('checkout.fibConfirming') : tr('checkout.fibWaiting'),
    codeLabel: tr('checkout.fibCodeLabel'),
    closeLabel: tr('checkout.fibClose'),
    retryLabel:
      status === 'bookingFailed' ? tr('checkout.fibRetryBooking') : tr('checkout.fibCheckAgain'),
    checkNowLabel: tr('checkout.fibCheckNow'),
    // Waiting, or timed out — both mean "not confirmed YET", and both deserve a
    // re-check that does NOT mint a second charge. A real decline / cancel /
    // expiry has its own retry instead.
    canCheckNow: visible && RECOVERABLE_STATUSES.has(status) && !!payment,
    payByPhone,
    close,
    retry,
    checkNow,
  };

  return { sheet, start };
}
