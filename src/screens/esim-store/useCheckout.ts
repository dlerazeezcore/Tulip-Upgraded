import { useState } from 'react';
import { confirmAction } from '@/lib/dialog';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useIqdAmount } from '@/lib/pricing';
import { useMoney, useIqdNote } from '@/lib/money';
import { useEsimCart } from '@/state/esimCart';
import { useAuthStore } from '@/state/authStore';
import { useEsimStore } from '@/state/esimStore';
import { useOrderStore } from '@/state/orderStore';
import { useDeviceStore } from '@/state/deviceStore';
import { useIsWideWeb } from '@/lib/responsive';
import { PAYMENT_METHODS } from '@/data/esim';
import { createManagedOrder } from '@/services/esim';
import { useFibPayment } from '@/screens/payment/useFibPayment';

export function useCheckout() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const money = useMoney();
  const iqdNote = useIqdNote();
  const iqdAmount = useIqdAmount();
  const { place, bundle, clear } = useEsimCart();
  const user = useAuthStore((s) => s.user);
  const refreshEsims = useEsimStore((s) => s.refresh);
  const refreshOrders = useOrderStore((s) => s.refresh);
  const isWide = useIsWideWeb();
  const esimSupport = useDeviceStore((s) => s.esimSupport);
  // Loyalty is a comped method reserved for loyalty (VIP/staff) accounts. Real
  // customers only see FIB; loyalty customers pay with loyalty by default
  // (product rule 2026-07-02) — the default stays reactive to the account
  // until the customer picks explicitly. The backend independently rejects
  // paymentMethod=loyalty from a non-loyalty token.
  const isLoyalty = !!user?.isLoyalty;
  const availableMethods = PAYMENT_METHODS.filter((p) => p.id !== 'loyalty' || isLoyalty);
  const [methodChoice, setMethod] = useState<'fib' | 'loyalty' | null>(null);
  const method: 'fib' | 'loyalty' = methodChoice ?? (isLoyalty ? 'loyalty' : 'fib');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fib = useFibPayment();

  const planLabel = bundle
    ? bundle.type === 'unlimited'
      ? tr('checkout.unlimitedData')
      : `${bundle.gb} GB`
    : '';

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/esim-store');
  };

  const placeOrder = async (
    payment: { method: 'loyalty' | 'fib'; status?: string; transactionId?: string },
    // Frozen at performPay start so the recorded sale price can never diverge
    // from the amount the customer was actually charged (a background FX
    // refresh between fib.start and onPaid used to recompute it — audit L1).
    salePriceMinor: number,
    providerPriceMinor: number,
    // Minted once per checkout attempt (see performPay) and shared with the
    // orderIntent we hand FIB, so the server-side finalizer recovers THIS order
    // under the same id instead of creating a second one.
    orderTransactionId: string,
  ) => {
    if (!place || !bundle || !user) return;
    const result = await createManagedOrder({
      transactionId: orderTransactionId,
      packageCode: bundle.packageCode!,
      periodNum: bundle.periodNum ?? bundle.days,
      providerPriceMinor,
      // displayName, not name: an order must identify its customer, and a
      // phone-only signup has no name yet.
      user: { phone: user.phone, name: user.displayName, email: user.email ?? null },
      countryCode: place.iso,
      countryName: place.name,
      packageName: `${place.name} ${planLabel} · ${bundle.days}d`,
      currencyCode: 'IQD',
      providerCurrencyCode: 'USD',
      paymentMethod: payment.method,
      paymentStatus: payment.status,
      paymentTransactionId: payment.transactionId,
      salePriceMinor,
    });
    // Booked. Everything after this point is best-effort: a failed cache
    // refresh must not surface as a "payment failed" error or strand the user
    // on a cleared-cart checkout (audit L5) — the target screens refresh on
    // mount anyway.
    clear();
    try { await refreshEsims(); } catch {}
    try { await refreshOrders(); } catch {}
    // Land on the eSIM they just bought, not the list. Buying is only half of
    // what the customer came to do — the bundle is useless until it is
    // installed, and the detail screen is where that happens (it polls for the
    // activation code and shows Activate / QR / manual entry). Dropping people
    // on the list left the last step to them, right after a payment that may
    // have bounced them out to the FIB app and back.
    //
    // Read the store fresh rather than through the subscribed selector: this
    // runs after an await, so the closure's copy predates the refresh above.
    const orderItemId = result?.database?.orderItemId;
    const profileId =
      orderItemId != null ? useEsimStore.getState().idByOrderItemId(orderItemId) : undefined;
    // No profile yet (the provider can lag) — the list is the honest fallback.
    // Never guess at "the newest one": that is how a customer ends up staring
    // at somebody else's earlier purchase.
    if (profileId) router.replace(`/esim/${profileId}`);
    else router.replace('/manage/esim');
  };

  const performPay = async () => {
    if (!place || !bundle || !user) return;
    // The provider price must come from the catalog row. Re-deriving it from
    // the display float was a silent rounding source (audit L2) — refuse the
    // order instead of guessing; the backend re-verifies amounts regardless.
    const providerPriceMinor = bundle.providerPriceMinor;
    if (providerPriceMinor == null) {
      setError(tr('common.somethingWrong'));
      return;
    }
    // Freeze the customer amount once, before any payment starts (audit L1).
    const amountIqd = iqdAmount(bundle.usd, bundle.saleIqdMinor);
    // One id for this checkout attempt, minted BEFORE payment starts so the
    // same id travels to FIB (as orderIntent) and to createManagedOrder. If the
    // app dies after paying, the backend finalizer replays this exact order id
    // — the server treats a matching id as an idempotent resubmit, so the
    // customer can never end up with two eSIMs (or a stuck 409) for one charge.
    const orderTransactionId = `APP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setBusy(true);
    try {
      if (method === 'loyalty') {
        await placeOrder(
          { method: 'loyalty', status: 'paid' },
          amountIqd,
          providerPriceMinor,
          orderTransactionId,
        );
        return;
      }

      // FIB: open the QR + "pay by phone" sheet. It polls for confirmation and
      // shows cancel/decline/expiry/timeout itself; we only book once it's paid.
      await fib.start(
        {
          amount: amountIqd,
          currency: 'IQD',
          description: `${place.name} eSIM`,
          metadata: {
            packageCode: bundle.packageCode,
            place: place.name,
            // Everything the backend needs to place THIS order without us. It
            // rides the checkout context onto the payment row once FIB confirms
            // the charge, so a paid-but-abandoned checkout is still delivered
            // instead of leaving the customer charged with nothing (no refunds).
            orderIntent: {
              transactionId: orderTransactionId,
              packageCode: bundle.packageCode,
              count: 1,
              periodNum: bundle.periodNum ?? bundle.days,
              providerPriceMinor,
              salePriceMinor: amountIqd,
              countryCode: place.iso,
              countryName: place.name,
              packageName: `${place.name} ${planLabel} · ${bundle.days}d`,
              currencyCode: 'IQD',
              providerCurrencyCode: 'USD',
              platformCode: 'tulip-mobile-app',
              platformName: 'Tulip Mobile App',
            },
          },
        },
        {
          onPaid: (p) =>
            placeOrder(
              { method: 'fib', status: 'paid', transactionId: p.paymentId },
              amountIqd,
              providerPriceMinor,
              orderTransactionId,
            ),
        },
      );
    } catch (e: any) {
      setError(e?.message || tr('checkout.failed'));
    } finally {
      setBusy(false);
    }
  };

  const onPay = async () => {
    if (busy) return;
    setError(null);
    if (!bundle?.packageCode) {
      setError(tr('checkout.noPackage'));
      return;
    }
    // If the OS told us this device has no eSIM hardware, make the user
    // acknowledge that the eSIM won't install on this phone before they pay.
    // The Share QR feature from the install screen makes "buying for another
    // person's phone" a real use case, so we don't hard-block — confirm.
    if (esimSupport === 'unsupported') {
      const proceed = await confirmAction({
        title: tr('checkout.unsupportedTitle'),
        message: tr('checkout.unsupportedBody'),
        confirmLabel: tr('checkout.continueAnyway'),
        cancelLabel: tr('common.cancel'),
        destructive: true,
      });
      if (!proceed) return;
      await performPay();
      return;
    }
    performPay();
  };

  return {
    place,
    bundle,
    user,
    planLabel,
    isWide,
    money,
    iqdNote,
    availableMethods,
    method,
    setMethod,
    busy,
    error,
    fibSheet: fib.sheet,
    goBack,
    onPay,
    browseEsims: () => router.replace('/esim-store'),
    goSignIn: () => router.push('/auth/sign-in?returnTo=checkout'),
    goSignUp: () => router.push('/auth/sign-up?returnTo=checkout'),
  };
}
