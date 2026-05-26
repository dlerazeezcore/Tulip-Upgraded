import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Lock, Landmark, Gift, Globe } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useIqdMoney, useIqdAmount } from '@/lib/pricing';
import { useEsimCart } from '@/state/esimCart';
import { useAuthStore } from '@/state/authStore';
import { useEsimStore } from '@/state/esimStore';
import { useOrderStore } from '@/state/orderStore';
import { useIsWideWeb } from '@/lib/responsive';
import { PAYMENT_METHODS } from '@/data/esim';
import { createManagedOrder } from '@/services/esim';
import { createFibPayment, pollFibPayment, isPaid } from '@/services/payments';
import { checkEsimSupport, isDefinitelyUnsupported } from '@/services/device';

// Representative flag for region eSIMs (mock).
const REGION_FLAG: Record<string, string> = {
  europe: 'EU',
  mena: 'AE',
  asia: 'JP',
  americas: 'US',
  global: 'UN',
};

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
      <Text style={{ fontSize: 13, color: strong ? t.fg : t.fgMuted, fontWeight: strong ? '700' : '400', fontFamily: strong ? t.font.displayMedium : t.font.body }}>
        {label}
      </Text>
      <Text style={{ fontSize: strong ? 18 : 13, color: t.fg, fontWeight: strong ? '700' : '600', fontFamily: strong ? t.font.display : t.font.bodyMedium }}>
        {value}
      </Text>
    </View>
  );
}

export default function Checkout() {
  const t = useTheme();
  const router = useRouter();
  const money = useIqdMoney();
  const iqdAmount = useIqdAmount();
  const { place, bundle, clear } = useEsimCart();
  const user = useAuthStore((s) => s.user);
  const isAdmin = !!user?.isAdmin;
  const refreshEsims = useEsimStore((s) => s.refresh);
  const refreshOrders = useOrderStore((s) => s.refresh);
  const isWide = useIsWideWeb();
  const [method, setMethod] = useState<'fib' | 'loyalty'>('loyalty');
  const [busy, setBusy] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/esim-store');
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
      <Pressable
        onPress={goBack}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronLeft size={18} color={t.fg} />
      </Pressable>
      <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
        Checkout
      </Text>
    </View>
  );

  // No selection — guard.
  if (!place || !bundle) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Text style={{ color: t.fgMuted }}>Nothing selected yet.</Text>
          <PrimaryButton label="Browse eSIMs" onPress={() => router.replace('/esim-store')} />
        </View>
      </SafeAreaView>
    );
  }

  const flagIso = place.iso ?? REGION_FLAG[place.id];
  const planLabel = bundle.type === 'unlimited' ? 'Unlimited data' : `${bundle.gb} GB`;

  // Login gate.
  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={30} color={t.primary} strokeWidth={2} />
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 20, color: t.fg }}>
              Sign in to continue
            </Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>
              Log in or create an account to complete your purchase.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, width: '100%', maxWidth: 360 }}>
            <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in?returnTo=checkout')} style={{ flex: 1 }} />
            <PrimaryButton label="Sign up" variant="ghost" onPress={() => router.push('/auth/sign-up?returnTo=checkout')} style={{ flex: 1 }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const placeOrder = async (payment: { method: 'loyalty' | 'fib'; status?: string; transactionId?: string }) => {
    const providerPriceMinor = bundle.providerPriceMinor ?? Math.round(bundle.usd * 10000);
    await createManagedOrder({
      transactionId: `APP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      packageCode: bundle.packageCode!,
      periodNum: bundle.periodNum ?? bundle.days,
      providerPriceMinor,
      user: { phone: user!.phone, name: user!.name, email: user!.email ?? null },
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

  const onPay = async () => {
    if (busy) return;
    if (isAdmin) {
      Alert.alert('Use a customer account', 'Purchasing requires a customer (non-admin) account. Please sign in as a user to buy.');
      return;
    }
    if (!bundle.packageCode) {
      Alert.alert('Plan unavailable', 'This plan can\'t be purchased yet. Please pick a country plan.');
      return;
    }
    setBusy(true);
    try {
      // Notify if the device can't use eSIM (still allow — they may install elsewhere).
      const support = await checkEsimSupport();
      if (isDefinitelyUnsupported(support)) {
        const proceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Device may not support eSIM',
            'This device does not appear to support eSIM. You can still buy and install it on a compatible device. Continue?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continue', onPress: () => resolve(true) },
            ],
          );
        });
        if (!proceed) {
          setBusy(false);
          return;
        }
      }

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
        Alert.alert('Payment not completed', 'We could not confirm your FIB payment. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Checkout failed', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      {header}
      <ScrollView contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 40, maxWidth: isWide ? 1000 : 720, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: isWide ? 24 : 16, alignItems: 'flex-start' }}>
          {/* Left: item + payment */}
          <View style={{ flex: 1, gap: 16, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
              {flagIso ? <Flag iso={flagIso} size={40} /> : <Globe size={32} color={t.primary} />}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg }}>{place.name}</Text>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{planLabel} · {bundle.days} days</Text>
              </View>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{money(bundle.usd)}</Text>
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, paddingHorizontal: 4 }}>
                Payment method
              </Text>
              <View style={{ gap: 10 }}>
                {PAYMENT_METHODS.map((p) => {
                  const on = p.id === method;
                  const Icon = p.id === 'fib' ? Landmark : Gift;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => setMethod(p.id)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: t.bgElev, borderWidth: 1.5, borderColor: on ? t.primary : t.border }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={on ? t.primary : t.fgMuted} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{p.name}</Text>
                        <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{p.desc}</Text>
                      </View>
                      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? t.primary : t.borderStrong, backgroundColor: on ? t.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {on && <Check size={13} color="#fff" strokeWidth={3} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Right: summary + pay */}
          <View style={{ width: isWide ? 360 : '100%', gap: 16 }}>
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                Order summary
              </Text>
              <SummaryRow label="Subtotal" value={money(bundle.usd)} />
              <SummaryRow label="Taxes & fees" value={money(0)} />
              <View style={{ height: 1, backgroundColor: t.border, marginVertical: 4 }} />
              <SummaryRow label="Total" value={money(bundle.usd)} strong />
            </View>

            {isAdmin && (
              <Text style={{ fontSize: 12, color: t.warning, textAlign: 'center' }}>
                Purchasing requires a customer account. Sign in as a user to buy.
              </Text>
            )}
            <PrimaryButton
              label={busy ? 'Processing…' : `Pay ${money(bundle.usd)}`}
              icon={<Lock size={15} color="#fff" strokeWidth={2.2} />}
              onPress={onPay}
            />
            <Text style={{ fontSize: 11, color: t.fgFaint, textAlign: 'center' }}>
              {method === 'fib'
                ? 'You\'ll confirm payment in the FIB app, then your eSIM is issued.'
                : 'Your eSIM is issued instantly after checkout.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
