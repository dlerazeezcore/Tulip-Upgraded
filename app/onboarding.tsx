// THIN UI — wiring lives in src/screens/onboarding/useOnboarding.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { DirectionalArrow } from '@/components/DirectionalArrow';
import { useTheme } from '@/theme/ThemeContext';
import { TulipLogo } from '@/components/TulipLogo';
import { Flag } from '@/components/Flag';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import type { CurrencyCode } from '@/data/currency';
import { useOnboarding } from '@/screens/onboarding/useOnboarding';

export default function Onboarding() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useOnboarding();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LinearGradient colors={t.gradHero as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingBottom: 28 }}>
        <ScreenSafeArea>
          <View style={{ paddingHorizontal: 24, paddingTop: 16, alignItems: 'center', gap: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: t.radius.card, backgroundColor: t.onHero.frost, alignItems: 'center', justifyContent: 'center' }}>
              <TulipLogo size={34} color={t.primary} />
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 26, color: t.onPrimary, letterSpacing: -0.6, textAlign: 'center' }}>
              {tr('onboarding.welcome')}
            </Text>
            <Text style={{ fontSize: 14, color: t.onPrimary, opacity: 0.9, textAlign: 'center' }}>
              {tr('onboarding.subtitle')}
            </Text>
          </View>
        </ScreenSafeArea>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 22, maxWidth: 560, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Language */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: t.font.display, fontSize: 16, fontWeight: '700', color: t.fg }}>
            {tr('onboarding.language')}
          </Text>
          {vm.langs.map((l) => {
            const on = l.id === vm.language;
            return (
              <Pressable
                key={l.id}
                onPress={() => vm.setLanguage(l.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  borderRadius: t.radius.card,
                  backgroundColor: t.bgElev,
                  borderWidth: 1.5,
                  borderColor: on ? t.primary : t.border,
                  ...t.shadow1,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg }}>{l.native}</Text>
                  <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                    {tr(l.id === 'en' ? 'onboarding.langSubEn' : l.id === 'ar' ? 'onboarding.langSubAr' : 'onboarding.langSubKu')}
                  </Text>
                </View>
                <Selected on={on} />
              </Pressable>
            );
          })}
        </View>

        {/* Currency */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: t.font.display, fontSize: 16, fontWeight: '700', color: t.fg }}>
            {tr('onboarding.currency')}
          </Text>
          {vm.currencyList.map((c) => {
            const on = c.code === vm.code;
            return (
              <Pressable
                key={c.code}
                onPress={() => vm.setCode(c.code as CurrencyCode)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  borderRadius: t.radius.card,
                  backgroundColor: t.bgElev,
                  borderWidth: 1.5,
                  borderColor: on ? t.primary : t.border,
                  ...t.shadow1,
                }}
              >
                <Flag iso={c.flag} size={30} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                    {c.code} · {c.symbol}
                  </Text>
                  <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{tr(`currency.${c.code}`, { defaultValue: c.name })}</Text>
                </View>
                <Selected on={on} />
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          label={tr('onboarding.getStarted')}
          icon={<DirectionalArrow size={16} color={t.onPrimary} strokeWidth={2.2} />}
          onPress={vm.onStart}
        />
      </ScrollView>
    </View>
  );
}

function Selected({ on }: { on: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: on ? t.primary : t.borderStrong,
        backgroundColor: on ? t.primary : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on && <Check size={14} color={t.onPrimary} strokeWidth={3} />}
    </View>
  );
}
