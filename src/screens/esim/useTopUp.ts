// Wiring for the eSIM top-up flow: tap "Top up" on a profile → choose a top-up
// data plan → pay with the SAME loyalty/FIB payment window we use at checkout →
// apply the top-up with the provider. Replaces the old one-tap instant top-up
// (which silently charged for the cheapest plan with no plan choice or payment).
//
// Payment is verified server-side: applyTopUp sends the payment method and FIB
// paymentId, and the backend re-verifies the charge (amount, ownership,
// single-use) against FIB before spending provider credit.
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useIqdAmount } from '@/lib/pricing';
import { useMoney, useIqdNote } from '@/lib/money';
import { useIsWideWeb } from '@/lib/responsive';
import { useAuthStore } from '@/state/authStore';
import { useEsimStore } from '@/state/esimStore';
import { useOrderStore } from '@/state/orderStore';
import { PAYMENT_METHODS, type Bundle } from '@/data/esim';
import { packageToBundle } from '@/lib/catalog';
import { findTopUpPackages, applyTopUp } from '@/services/esim';
import { useFibPayment } from '@/screens/payment/useFibPayment';

export type TopUpStep = 'choose' | 'pay';

export function useTopUp() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const money = useMoney();
  const iqdNote = useIqdNote();
  const iqdAmount = useIqdAmount();
  const isWide = useIsWideWeb();

  const esims = useEsimStore((s) => s.esims);
  const byId = useEsimStore((s) => s.byId);
  const refreshEsims = useEsimStore((s) => s.refresh);
  const refreshOrders = useOrderStore((s) => s.refresh);
  const user = useAuthStore((s) => s.user);

  const esim = esims.find((e) => e.id === id);
  const profile = esim ? byId(esim.id) : undefined;
  const iccid = profile?.iccid ?? esim?.iccid ?? '';

  const [step, setStep] = useState<TopUpStep>('choose');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Bundle[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Bundle | null>(null);

  // Payment selection mirrors useCheckout: Loyalty is comped and reserved for
  // loyalty accounts (also enforced server-side) — loyalty customers pay with
  // loyalty by default; everyone else pays FIB (or future methods). The
  // default stays reactive to the account until the customer picks explicitly.
  const isLoyalty = !!user?.isLoyalty;
  const availableMethods = PAYMENT_METHODS.filter((p) => p.id !== 'loyalty' || isLoyalty);
  const [methodChoice, setMethod] = useState<'fib' | 'loyalty' | null>(null);
  const method: 'fib' | 'loyalty' = methodChoice ?? (isLoyalty ? 'loyalty' : 'fib');
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const fib = useFibPayment();

  const load = useCallback(async () => {
    if (!iccid) {
      setLoading(false);
      setLoadError(tr('topup.noIccid'));
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const pkgs = await findTopUpPackages(iccid);
      // The provider returns many coverage/quality variants for the same
      // data+duration; collapse to the cheapest per (type, GB, days) so the
      // customer sees one clean row per size — same approach as the catalog.
      const best = new Map<string, Bundle>();
      for (const p of pkgs) {
        if (!p?.packageCode) continue;
        const b = packageToBundle(p, esim?.iso ?? 'topup');
        const key = `${b.type}-${b.gb}-${b.days}`;
        const cur = best.get(key);
        if (!cur || b.usd < cur.usd) best.set(key, b);
      }
      setPlans([...best.values()].sort((a, b) => a.usd - b.usd));
    } catch (e: any) {
      setLoadError(e?.message || tr('topup.loadError'));
    } finally {
      setLoading(false);
    }
  }, [iccid, esim?.iso, tr]);

  useEffect(() => {
    load();
  }, [load]);

  const goBack = () => {
    // On the payment step, "back" returns to the plan chooser instead of
    // leaving the screen — so the user can pick a different plan.
    if (step === 'pay') {
      setStep('choose');
      setPayError(null);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace(`/esim/${id}`);
  };

  const choose = (plan: Bundle) => {
    setSelected(plan);
    setPayError(null);
    setStep('pay');
  };

  const changePlan = () => {
    setStep('choose');
    setPayError(null);
  };

  /** Human label for a bundle, e.g. "10 GB" or "Unlimited data". */
  const planLabel = (b: Bundle) => (b.type === 'unlimited' ? tr('esim.unlimitedData') : `${b.gb} GB`);

  const apply = async (payment: { method: 'fib' | 'loyalty'; providerPaymentId?: string }) => {
    if (!selected?.packageCode || !iccid) return;
    await applyTopUp({
      iccid,
      esimTranNo: profile?.esimTranNo ?? undefined,
      packageCode: selected.packageCode,
      transactionId: `TOPUP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      paymentMethod: payment.method,
      paymentProviderPaymentId: payment.providerPaymentId,
    });
    await refreshEsims();
    await refreshOrders();
    // Land back on the eSIM detail so the refreshed data/validity is visible.
    router.replace(`/esim/${id}`);
  };

  const performPay = async () => {
    if (!selected || !user) return;
    setBusy(true);
    setPayError(null);
    try {
      if (method === 'loyalty') {
        await apply({ method: 'loyalty' });
        return;
      }
      // FIB: open the QR + "pay by phone" sheet. It polls and shows its own
      // cancel/decline/expiry/timeout state; we only apply the top-up once paid.
      const amountIqd = iqdAmount(selected.usd, selected.saleIqdMinor);
      await fib.start(
        {
          amount: amountIqd,
          currency: 'IQD',
          description: `${esim?.country ?? 'eSIM'} top-up`,
          metadata: { packageCode: selected.packageCode, iccid, kind: 'topup' },
        },
        { onPaid: (p) => apply({ method: 'fib', providerPaymentId: p.paymentId }) },
      );
    } catch (e: any) {
      setPayError(e?.message || tr('checkout.failed'));
    } finally {
      setBusy(false);
    }
  };

  const onPay = () => {
    if (busy) return;
    setPayError(null);
    if (!selected?.packageCode) {
      setPayError(tr('checkout.noPackage'));
      return;
    }
    performPay();
  };

  return {
    esim,
    iccid,
    isWide,
    user,
    step,
    loading,
    plans,
    loadError,
    selected,
    method,
    setMethod,
    availableMethods,
    busy,
    payError,
    fibSheet: fib.sheet,
    money,
    iqdNote,
    planLabel,
    reload: load,
    goBack,
    choose,
    changePlan,
    onPay,
  };
}
