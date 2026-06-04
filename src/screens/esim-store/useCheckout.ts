import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useIqdMoney, useIqdAmount } from '@/lib/pricing';
import { useEsimCart } from '@/state/esimCart';
import { useAuthStore } from '@/state/authStore';
import { useEsimStore } from '@/state/esimStore';
import { useOrderStore } from '@/state/orderStore';
import { useDeviceStore } from '@/state/deviceStore';
import { useIsWideWeb } from '@/lib/responsive';
import { PAYMENT_METHODS } from '@/data/esim';
import { createManagedOrder } from '@/services/esim';
import { createFibPayment, pollFibPayment, isPaid, fibOutcome } from '@/services/payments';

export function useCheckout() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const money = useIqdMoney();
  const iqdAmount = useIqdAmount();
  const { place, bundle, clear } = useEsimCart();
  const user = useAuthStore((s) => s.user);
  const refreshEsims = useEsimStore((s) => s.refresh);
  const refreshOrders = useOrderStore((s) => s.refresh);
  const isWide = useIsWideWeb();
  const esimSupport = useDeviceStore((s) => s.esimSupport);
  // Loyalty is a comped method reserved for loyalty (VIP/staff) accounts. Real
  // customers only see FIB, and FIB is the default for everyone so a normal
  // user can never accidentally check out for free. The backend independently
  // rejects paymentMethod=loyalty from a non-loyalty token.
  const isLoyalty = !!user?.isLoyalty;
  const availableMethods = PAYMENT_METHODS.filter((p) => p.id !== 'loyalty' || isLoyalty);
  const [method, setMethod] = useState<'fib' | 'loyalty'>('fib');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planLabel = bundle
    ? bundle.type === 'unlimited'
      ? tr('checkout.unlimitedData')
      : `${bundle.gb} GB`
    : '';

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/esim-store');
  };

  const placeOrder = async (payment: { method: 'loyalty' | 'fib'; status?: string; transactionId?: string }) => {
    if (!place || !bundle || !user) return;
    const providerPriceMinor = bundle.providerPriceMinor ?? Math.round(bundle.usd * 10000);
    await createManagedOrder({
      transactionId: `APP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      packageCode: bundle.packageCode!,
      periodNum: bundle.periodNum ?? bundle.days,
      providerPriceMinor,
      user: { phone: user.phone, name: user.name, email: user.email ?? null },
      countryCode: place.iso,
      countryName: place.name,
      packageName: `${place.name} ${planLabel} · ${bundle.days}d`,
      currencyCode: 'IQD',
      providerCurrencyCode: 'USD',
      paymentMethod: payment.method,
      paymentStatus: payment.status,
      paymentTransactionId: payment.transactionId,
      salePriceMinor: iqdAmount(bundle.usd),
    });
    clear();
    await refreshEsims();
    await refreshOrders();
    router.replace('/manage/esim');
  };

  const performPay = async () => {
    if (!place || !bundle || !user) return;
    setBusy(true);
    try {
      if (method === 'loyalty') {
        await placeOrder({ method: 'loyalty', status: 'paid' });
        return;
      }

      // FIB: create payment, open the FIB app, poll for confirmation, then book.
      const amountIqd = iqdAmount(bundle.usd);
      const payment = await createFibPayment({
        amount: amountIqd,
        currency: 'IQD',
        description: `${place.name} eSIM`,
        metadata: { packageCode: bundle.packageCode, place: place.name },
      });
      if (payment.redirectUrl) {
        Linking.openURL(payment.redirectUrl).catch(() => {});
      }
      const final = await pollFibPayment(payment.paymentId, { timeoutMs: 180000 });
      if (isPaid(final)) {
        await placeOrder({ method: 'fib', status: 'paid', transactionId: payment.paymentId });
      } else {
        // Distinguish cancel / decline / expiry / timeout so the user knows
        // whether to retry or just wait for the eSIM to appear.
        const oc = fibOutcome(final);
        setError(tr(`checkout.fib${oc.charAt(0).toUpperCase()}${oc.slice(1)}`));
      }
    } catch (e: any) {
      setError(e?.message || tr('checkout.failed'));
    } finally {
      setBusy(false);
    }
  };

  const onPay = () => {
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
      Alert.alert(
        tr('checkout.unsupportedTitle'),
        tr('checkout.unsupportedBody'),
        [
          { text: tr('common.cancel'), style: 'cancel' },
          { text: tr('checkout.continueAnyway'), style: 'destructive', onPress: performPay },
        ],
      );
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
    availableMethods,
    method,
    setMethod,
    busy,
    error,
    goBack,
    onPay,
    browseEsims: () => router.replace('/esim-store'),
    goSignIn: () => router.push('/auth/sign-in?returnTo=checkout'),
    goSignUp: () => router.push('/auth/sign-up?returnTo=checkout'),
  };
}
