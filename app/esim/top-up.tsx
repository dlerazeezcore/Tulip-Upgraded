// THIN UI — wiring lives in src/screens/esim/useTopUp.ts.
// Two phases on one screen:
//   1) "choose" — pick a top-up data plan (mirrors the provider's list).
//   2) "pay"    — the same loyalty/FIB payment window used at checkout.
import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Check, Lock, Landmark, Gift, Plus } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { FibPaymentSheet } from '@/components/FibPaymentSheet';
import { useTopUp } from '@/screens/esim/useTopUp';

function daysSuffix(days: number, word: string) {
  return days > 0 ? ` · ${days} ${word}` : '';
}

export default function TopUp() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useTopUp();
  const esim = vm.esim;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
      <Pressable
        onPress={vm.goBack}
        accessibilityRole="button"
        accessibilityLabel={tr('a11y.back')}
        hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
      >
        <DirectionalChevron direction="back" size={18} color={t.fg} />
      </Pressable>
      <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
        {tr('topup.title')}
      </Text>
    </View>
  );

  if (!esim) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Text style={{ color: t.fgMuted }}>{tr('esim.notFound')}</Text>
          <PrimaryButton label={tr('common.back')} onPress={vm.goBack} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      {header}
      <ScrollView
        contentContainerStyle={{ padding: vm.isWide ? 28 : 20, paddingBottom: 40, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* eSIM the top-up applies to */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
          <Flag iso={esim.iso} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>{esim.country}</Text>
            <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
              {vm.step === 'choose' ? tr('topup.subtitle') : tr('topup.paySubtitle')}
            </Text>
          </View>
        </View>

        {vm.step === 'choose' ? (
          <ChooseStep vm={vm} esimIso={esim.iso} />
        ) : (
          <PayStep vm={vm} esimIso={esim.iso} />
        )}
      </ScrollView>
      <FibPaymentSheet sheet={vm.fibSheet} />
    </SafeAreaView>
  );
}

function ChooseStep({ vm, esimIso }: { vm: ReturnType<typeof useTopUp>; esimIso: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();

  if (vm.loading) {
    // Skeletons shaped like the plan rows below (same pattern as the store's
    // package list) so the screen keeps its layout while plans load.
    return (
      <View style={{ gap: 10 }}>
        <Skeleton width={96} height={26} radius={t.radius.pill} />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={72} radius={16} />
        ))}
      </View>
    );
  }

  if (vm.loadError) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center', gap: 14 }}>
        <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center', maxWidth: 320 }}>{vm.loadError}</Text>
        <PrimaryButton label={tr('common.tryAgain')} variant="ghost" onPress={vm.reload} />
      </View>
    );
  }

  if (vm.plans.length === 0) {
    return <EmptyState icon={Plus} title={tr('topup.noneTitle')} subtitle={tr('topup.none')} />;
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 4 }}>
        {tr('topup.choosePlan')}
      </Text>
      {vm.plans.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => vm.choose(p)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}
        >
          <Flag iso={esimIso} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
              {vm.planLabel(p)}{daysSuffix(p.days, tr('esim.days'))}
            </Text>
            <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{vm.money(p.usd, p.saleIqdMinor)}</Text>
          </View>
          <DirectionalChevron direction="forward" size={18} color={t.fgFaint} />
        </Pressable>
      ))}
    </View>
  );
}

function PayStep({ vm, esimIso }: { vm: ReturnType<typeof useTopUp>; esimIso: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const plan = vm.selected!;

  return (
    <View style={{ gap: 16 }}>
      {/* Selected plan */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
        <Flag iso={esimIso} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
            {vm.planLabel(plan)}{daysSuffix(plan.days, tr('checkout.days'))}
          </Text>
          <Pressable onPress={vm.changePlan} hitSlop={8}>
            <Text style={{ fontSize: 12, color: t.primary, fontWeight: '700', marginTop: 2 }}>{tr('topup.changePlan')}</Text>
          </Pressable>
        </View>
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{vm.money(plan.usd, plan.saleIqdMinor)}</Text>
      </View>

      {/* Payment method — same window as checkout */}
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
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: on ? t.infoBg : t.bgElev, borderWidth: on ? 2 : 1.5, borderColor: on ? t.primary : t.border }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
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

      {/* Summary */}
      <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
          {tr('checkout.orderSummary')}
        </Text>
        <SummaryRow label={tr('checkout.subtotal')} value={vm.money(plan.usd, plan.saleIqdMinor)} />
        <SummaryRow label={tr('checkout.taxesFees')} value={vm.money(0)} />
        <View style={{ height: 1, backgroundColor: t.border, marginVertical: 4 }} />
        <SummaryRow label={tr('checkout.total')} value={vm.money(plan.usd, plan.saleIqdMinor)} strong />
      </View>

      {vm.payError && <Text style={{ fontSize: 12, color: t.danger, textAlign: 'center' }}>{vm.payError}</Text>}

      <PrimaryButton
        label={vm.busy ? tr('checkout.processing') : tr('checkout.pay', { amount: vm.money(plan.usd, plan.saleIqdMinor) })}
        icon={<Lock size={15} color={t.onPrimary} strokeWidth={2.2} />}
        onPress={vm.onPay}
      />
      {!!vm.iqdNote(plan.usd, plan.saleIqdMinor) && (
        <Text style={{ fontSize: 12, color: t.fgMuted, textAlign: 'center' }}>
          {vm.iqdNote(plan.usd, plan.saleIqdMinor)} · {tr('checkout.chargedInIqd')}
        </Text>
      )}
      <Text style={{ fontSize: 11, color: t.fgFaint, textAlign: 'center' }}>
        {vm.method === 'fib' ? tr('checkout.fibHint') : tr('checkout.loyaltyHint')}
      </Text>
    </View>
  );
}

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
