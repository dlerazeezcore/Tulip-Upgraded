import React from 'react';
import { ScrollView, View, Text, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Star, ChevronRight, CreditCard, User, Moon, Globe, Bell, Coins } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStore } from '@/state/themeStore';
import { USER } from '@/data/user';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useCurrencyStore } from '@/state/currencyStore';
import { CURRENCIES } from '@/data/currency';

function Row({
  icon,
  title,
  sub,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomColor: t.border,
        borderBottomWidth: 1,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: t.bgSunken,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 14, color: t.fg }}>
          {title}
        </Text>
        {sub && <Text style={{ fontSize: 11, color: t.fgMuted, marginTop: 2 }}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

export default function Profile() {
  const t = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const currencyName = CURRENCIES[useCurrencyStore((s) => s.code)].name;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20, maxWidth: 900, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Profile" />

        {/* User hero — photo backdrop + frosted glass card */}
        <View style={{ borderRadius: 20, overflow: 'hidden', ...t.shadow2 }}>
          <Image
            source="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={[`${t.primary}D0`, 'rgba(15,23,42,0.78)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            pointerEvents="none"
          />
          <BlurView intensity={20} tint="dark" style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(255,255,255,0.28)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.35)',
                }}
              >
                <Text
                  style={{
                    fontFamily: t.font.display,
                    fontWeight: '700',
                    fontSize: 22,
                    color: '#fff',
                    letterSpacing: -0.4,
                  }}
                >
                  {USER.initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: t.font.display,
                    fontWeight: '700',
                    fontSize: 20,
                    color: '#fff',
                    letterSpacing: -0.4,
                  }}
                >
                  {USER.firstName} {USER.lastName}
                </Text>
                <Text style={{ fontSize: 12, color: '#fff', opacity: 0.88 }}>{USER.email}</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 8,
                    alignSelf: 'flex-start',
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    borderRadius: 999,
                  }}
                >
                  <Star size={11} color="#fff" fill="#fff" />
                  <Text
                    style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}
                  >
                    {USER.tier} · Member since {USER.memberSince}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Travelers */}
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: t.fgMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            Travelers
          </Text>
          <View
            style={{
              backgroundColor: t.bgElev,
              borderRadius: 14,
              borderColor: t.border,
              borderWidth: 1,
              overflow: 'hidden',
            }}
          >
            {USER.travelers.map((tr, i) => (
              <Row
                key={tr.id}
                icon={<User size={16} color={t.fgMuted} />}
                title={tr.name}
                sub={`${tr.relation} · ${tr.dob}`}
                right={<ChevronRight size={16} color={t.fgFaint} />}
              />
            ))}
          </View>
        </View>

        {/* Payment methods */}
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: t.fgMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            Payment methods
          </Text>
          <View
            style={{
              backgroundColor: t.bgElev,
              borderRadius: 14,
              borderColor: t.border,
              borderWidth: 1,
              overflow: 'hidden',
            }}
          >
            {USER.payment.map((p) => (
              <Row
                key={p.id}
                icon={<CreditCard size={16} color={t.fgMuted} />}
                title={`${p.brand} •• ${p.last4}`}
                sub={`Exp ${p.exp}${p.primary ? ' · Primary' : ''}`}
                right={<ChevronRight size={16} color={t.fgFaint} />}
              />
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: t.fgMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            Preferences
          </Text>
          <View
            style={{
              backgroundColor: t.bgElev,
              borderRadius: 14,
              borderColor: t.border,
              borderWidth: 1,
              overflow: 'hidden',
            }}
          >
            <Row
              icon={<Moon size={16} color={t.fgMuted} />}
              title="Dark mode"
              sub={mode === 'dark' ? 'On' : 'Off'}
              right={
                <Switch
                  value={mode === 'dark'}
                  onValueChange={toggle}
                  trackColor={{ false: t.bgSunken, true: t.primary }}
                  thumbColor="#fff"
                />
              }
            />
            <Row
              icon={<Coins size={16} color={t.fgMuted} />}
              title="Currency"
              sub={currencyName}
              right={<CurrencyPicker />}
            />
            <Row
              icon={<Globe size={16} color={t.fgMuted} />}
              title="Language"
              sub="English (US)"
              right={<ChevronRight size={16} color={t.fgFaint} />}
            />
            <Row
              icon={<Bell size={16} color={t.fgMuted} />}
              title="Notifications"
              sub="Trip alerts, deals"
              right={<ChevronRight size={16} color={t.fgFaint} />}
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => ({
            padding: 14,
            borderRadius: 14,
            borderColor: t.danger,
            borderWidth: 1.5,
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: t.danger, fontWeight: '700', fontSize: 14 }}>Sign out</Text>
        </Pressable>
      </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
}
