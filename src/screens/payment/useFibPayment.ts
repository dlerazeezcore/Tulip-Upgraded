// Wiring for the FIB payment sheet. Owns the created payment, the QR, the
// "pay by phone" deeplink, live status polling (with cancellation on close /
// unmount) and the terminal outcome. The thin <FibPaymentSheet> renders the
// returned `sheet` view-model; checkout / top-up call `start()` and run their
// own `onPaid` (place order / apply top-up) once FIB confirms the charge.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createFibPayment, pollFibPayment, fibOutcome } from '@/services/payments';
import type { FibPayment } from '@/services/types';

export type FibSheetStatus =
  | 'waiting'
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
  title: string;
  scanHint: string;
  payByPhoneLabel: string;
  orLabel: string;
  waitingLabel: string;
  codeLabel: string;
  closeLabel: string;
  retryLabel: string;
  payByPhone: () => void;
  close: () => void;
  retry: () => void;
};

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

  // Stop any in-flight poll if the screen unmounts mid-payment.
  useEffect(() => () => { cancelledRef.current = true; }, []);

  const runPoll = useCallback(async (p: FibPayment) => {
    cancelledRef.current = false;
    setStatus('waiting');
    const final = await pollFibPayment(p.paymentId, {
      timeoutMs: 180000,
      isCancelled: () => cancelledRef.current,
    });
    const oc = fibOutcome(final);
    // Always honor a confirmed payment — even if the sheet was just closed —
    // so the user never pays without getting the order placed.
    if (oc === 'paid') {
      paidPaymentRef.current = final;
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
    // Otherwise, a closed/unmounted sheet stops silently; live ones show why.
    if (cancelledRef.current) return;
    setStatus(oc);
  }, []);

  const start = useCallback(
    async (args: FibCreateArgs, opts: { onPaid: (p: FibPayment) => void | Promise<void> }) => {
      lastArgsRef.current = args;
      onPaidRef.current = opts.onPaid;
      cancelledRef.current = false;
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
  const isTerminalNonPaid = status !== 'waiting' && status !== 'paid';

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
    title: tr('checkout.fibPayTitle'),
    scanHint: tr('checkout.fibScanHint'),
    payByPhoneLabel: tr('checkout.fibPayByPhone'),
    orLabel: tr('checkout.fibOr'),
    waitingLabel: tr('checkout.fibWaiting'),
    codeLabel: tr('checkout.fibCodeLabel'),
    closeLabel: tr('checkout.fibClose'),
    retryLabel:
      status === 'bookingFailed' ? tr('checkout.fibRetryBooking') : tr('checkout.fibCheckAgain'),
    payByPhone,
    close,
    retry,
  };

  return { sheet, start };
}
