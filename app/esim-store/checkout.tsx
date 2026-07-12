// THIN UI — wiring lives in src/screens/esim-store/useCheckout.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Lock, Landmark, Gift, Globe, ShoppingBag } from 'lucide-react-native';
import { StackHeader } from '@/components/StackHeader';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { EsimSupportBanner } from '@/components/EsimSupportBanner';
import { FibPaymentSheet } from '@/components/FibPaymentSheet';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useCheckout } from '@/screens/esim-store/useCheckout';

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
  const { t: tr } = useTranslation();
  const vm = useCheckout();
  const { place, bundle, user } = vm;

  const header = <StackHeader title={tr('checkout.title')} onBack={vm.goBack} />;

  // No selection — guard.
  if (!place || !bundle) {
    return (
      <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
        {header}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon={ShoppingBag}
            title={tr('checkout.nothingSelected')}
            action={<PrimaryButton label={tr('checkout.browseEsims')} onPress={vm.browseEsims} />}
          />
        </View>
      </ScreenSafeArea>
    );
  }

  const flagIso = place.iso ?? REGION_FLAG[place.id];
  const planLabel = vm.planLabel;

  // Login gate.
  if (!user) {
    return (
      <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
        {header}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon={Lock}
            tone="primary"
            title={tr('checkout.signInToContinue')}
            subtitle={tr('checkout.signInSub')}
            action={
              <View style={{ flexDirection: 'row', gap: 10, maxWidth: 340, width: '100%' }}>
                <PrimaryButton label={tr('common.signIn')} onPress={vm.goSignIn} style={{ flex: 1.4 }} />
                <PrimaryButton label={tr('common.signUp')} variant="ghost" onPress={vm.goSignUp} style={{ flex: 1 }} />
              </View>
            }
          />
        </View>
      </ScreenSafeArea>
    );
  }

  // Named blocks, composed per breakpoint below.
  const itemCard = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: t.radius.card, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
      {flagIso ? <Flag iso={flagIso} size={40} /> : <Globe size={32} color={t.primary} />}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg }}>{place.name}</Text>
        <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{planLabel} · {bundle.days} {tr('checkout.days')}</Text>
      </View>
      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{vm.money(bundle.usd, bundle.saleIqdMinor)}</Text>
    </View>
  );

  const paymentPicker = (
    <View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, paddingHorizontal: 4 }}>
        {tr('checkout.paymentMethod')}
      </Text>
      <View style={{ gap: 10 }}>
        {vm.availableMethods.map((p) => {
          const on = p.id === vm.method;
          const Icon = p.id === 'fib' ? Landmark : Gift;
          return (
            <Pressable
              key={p.id}
              onPress={() => vm.setMethod(p.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: t.radius.md, backgroundColor: on ? t.infoBg : t.bgElev, borderWidth: on ? 2 : 1.5, borderColor: on ? t.primary : t.border }}
            >
              <View style={{ width: 40, height: 40, borderRadius: t.radius.sm, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={on ? t.primary : t.fgMuted} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{tr(`checkout.method.${p.id}`)}</Text>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{tr(`checkout.methodDesc.${p.id}`)}</Text>
              </View>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? t.primary : t.borderStrong, backgroundColor: on ? t.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {on && <Check size={13} color={t.onPrimary} strokeWidth={3} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const summaryCard = (
    <View style={{ padding: 16, borderRadius: t.radius.card, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
        {tr('checkout.orderSummary')}
      </Text>
      <SummaryRow label={tr('checkout.subtotal')} value={vm.money(bundle.usd, bundle.saleIqdMinor)} />
      {/* FE-26: taxes/fees row is omitted while it is always zero */}
      <View style={{ height: 1, backgroundColor: t.border, marginVertical: 4 }} />
      <SummaryRow label={tr('checkout.total')} value={vm.money(bundle.usd, bundle.saleIqdMinor)} strong />
    </View>
  );

  const payStack = (
    <>
      {vm.error && (
        <Text style={{ fontSize: 12, color: t.danger, textAlign: 'center' }}>{vm.error}</Text>
      )}
      <PrimaryButton
        label={vm.busy ? tr('checkout.processing') : tr('checkout.pay', { amount: vm.money(bundle.usd, bundle.saleIqdMinor) })}
        icon={<Lock size={15} color={t.onPrimary} strokeWidth={2.2} />}
        onPress={vm.onPay}
      />
      {!!vm.iqdNote(bundle.usd, bundle.saleIqdMinor) && (
        <Text style={{ fontSize: 12, color: t.fgMuted, textAlign: 'center' }}>
          {vm.iqdNote(bundle.usd, bundle.saleIqdMinor)} · {tr('checkout.chargedInIqd')}
        </Text>
      )}
      <Text style={{ fontSize: 11, color: t.fgFaint, textAlign: 'center' }}>
        {vm.method === 'fib' ? tr('checkout.fibHint') : tr('checkout.loyaltyHint')}
      </Text>
    </>
  );

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      {header}
      <ScrollView contentContainerStyle={{ padding: vm.isWide ? 28 : 20, paddingBottom: 40, maxWidth: vm.isWide ? 1000 : 720, width: '100%', alignSelf: 'center' }}>
        {/* eSIM hardware advisory — only shown when the OS definitively says no. */}
        <View style={{ marginBottom: 16 }}>
          <EsimSupportBanner message={tr('checkout.bannerUnsupported')} />
        </View>
        {vm.isWide ? (
          /* FE-26 rebalance: the pay CTA used to sit in the opposite column
             from the method picker, leaving lopsided column heights. Wide web
             now groups order info (item + summary) left and the payment action
             (picker + pay + notes) right. */
          <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 16, width: '100%' }}>
              {itemCard}
              {summaryCard}
            </View>
            <View style={{ width: 360, gap: 16 }}>
              {paymentPicker}
              {payStack}
            </View>
          </View>
        ) : (
          /* Mobile/native — unchanged order below the breakpoint. */
          <View style={{ flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 16, width: '100%' }}>
              {itemCard}
              {paymentPicker}
            </View>
            <View style={{ width: '100%', gap: 16 }}>
              {summaryCard}
              {payStack}
            </View>
          </View>
        )}
      </ScrollView>
      <FibPaymentSheet sheet={vm.fibSheet} />
    </ScreenSafeArea>
  );
}
