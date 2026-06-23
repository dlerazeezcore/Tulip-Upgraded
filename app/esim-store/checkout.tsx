// THIN UI — wiring lives in src/screens/esim-store/useCheckout.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Check, Lock, Landmark, Gift, Globe } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EsimSupportBanner } from '@/components/EsimSupportBanner';
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

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
      <Pressable
        onPress={vm.goBack}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronLeft size={18} color={t.fg} />
      </Pressable>
      <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
        {tr('checkout.title')}
      </Text>
    </View>
  );

  // No selection — guard.
  if (!place || !bundle) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Text style={{ color: t.fgMuted }}>{tr('checkout.nothingSelected')}</Text>
          <PrimaryButton label={tr('checkout.browseEsims')} onPress={vm.browseEsims} />
        </View>
      </SafeAreaView>
    );
  }

  const flagIso = place.iso ?? REGION_FLAG[place.id];
  const planLabel = vm.planLabel;

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
              {tr('checkout.signInToContinue')}
            </Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>
              {tr('checkout.signInSub')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, width: '100%', maxWidth: 360 }}>
            <PrimaryButton label={tr('common.signIn')} onPress={vm.goSignIn} style={{ flex: 1 }} />
            <PrimaryButton label={tr('common.signUp')} variant="ghost" onPress={vm.goSignUp} style={{ flex: 1 }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      {header}
      <ScrollView contentContainerStyle={{ padding: vm.isWide ? 28 : 20, paddingBottom: 40, maxWidth: vm.isWide ? 1000 : 720, width: '100%', alignSelf: 'center' }}>
        {/* eSIM hardware advisory — only shown when the OS definitively says no. */}
        <View style={{ marginBottom: 16 }}>
          <EsimSupportBanner message={tr('checkout.bannerUnsupported')} />
        </View>
        <View style={{ flexDirection: vm.isWide ? 'row' : 'column', gap: vm.isWide ? 24 : 16, alignItems: 'flex-start' }}>
          {/* Left: item + payment */}
          <View style={{ flex: 1, gap: 16, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
              {flagIso ? <Flag iso={flagIso} size={40} /> : <Globe size={32} color={t.primary} />}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg }}>{place.name}</Text>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{planLabel} · {bundle.days} {tr('checkout.days')}</Text>
              </View>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{vm.money(bundle.usd)}</Text>
            </View>

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
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: t.bgElev, borderWidth: 1.5, borderColor: on ? t.primary : t.border }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={on ? t.primary : t.fgMuted} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{tr(`checkout.method.${p.id}`)}</Text>
                        <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{tr(`checkout.methodDesc.${p.id}`)}</Text>
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
          <View style={{ width: vm.isWide ? 360 : '100%', gap: 16 }}>
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, ...t.shadow1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                {tr('checkout.orderSummary')}
              </Text>
              <SummaryRow label={tr('checkout.subtotal')} value={vm.money(bundle.usd)} />
              <SummaryRow label={tr('checkout.taxesFees')} value={vm.money(0)} />
              <View style={{ height: 1, backgroundColor: t.border, marginVertical: 4 }} />
              <SummaryRow label={tr('checkout.total')} value={vm.money(bundle.usd)} strong />
            </View>

            {vm.error && (
              <Text style={{ fontSize: 12, color: t.danger, textAlign: 'center' }}>{vm.error}</Text>
            )}
            <PrimaryButton
              label={vm.busy ? tr('checkout.processing') : tr('checkout.pay', { amount: vm.money(bundle.usd) })}
              icon={<Lock size={15} color="#fff" strokeWidth={2.2} />}
              onPress={vm.onPay}
            />
            {!!vm.iqdNote(bundle.usd) && (
              <Text style={{ fontSize: 12, color: t.fgMuted, textAlign: 'center' }}>
                {vm.iqdNote(bundle.usd)} · {tr('checkout.chargedInIqd')}
              </Text>
            )}
            <Text style={{ fontSize: 11, color: t.fgFaint, textAlign: 'center' }}>
              {vm.method === 'fib' ? tr('checkout.fibHint') : tr('checkout.loyaltyHint')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
