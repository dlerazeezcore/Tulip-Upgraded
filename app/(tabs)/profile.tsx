import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Star, ChevronRight, ChevronDown, CreditCard, User, Moon, Globe, Bell, Coins, MessageCircle, Receipt, ShieldCheck, LogIn } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStore } from '@/state/themeStore';
import { USER } from '@/data/user';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useCurrencyStore } from '@/state/currencyStore';
import { CURRENCIES } from '@/data/currency';
import { useAuthStore } from '@/state/authStore';
import { useAdminStore } from '@/state/adminStore';

function Row({
  icon,
  title,
  sub,
  right,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const t = useTheme();
  const Container: any = onPress ? Pressable : View;
  return (
    <Container
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomColor: t.border,
        borderBottomWidth: last ? 0 : 1,
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
    </Container>
  );
}

export default function Profile() {
  const t = useTheme();
  const router = useRouter();
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const currencyName = CURRENCIES[useCurrencyStore((s) => s.code)].name;
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const setAdmin = useAdminStore((s) => s.setAdmin);
  const [travelersOpen, setTravelersOpen] = useState(false);

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
            {user ? (
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
                  <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 22, color: '#fff', letterSpacing: -0.4 }}>
                    {user.initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 20, color: '#fff', letterSpacing: -0.4 }}>
                    {user.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#fff', opacity: 0.88 }}>{user.email ?? user.phone}</Text>
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
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                      {USER.tier} · Member since {USER.memberSince}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 20, color: '#fff', letterSpacing: -0.4 }}>
                    Welcome to Tulip
                  </Text>
                  <Text style={{ fontSize: 13, color: '#fff', opacity: 0.88, marginTop: 2 }}>
                    Sign in to manage bookings, eSIMs and more.
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} style={{ flex: 1 }} />
                  <PrimaryButton
                    label="Sign up"
                    onPress={() => router.push('/auth/sign-up')}
                    style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.22)' }}
                  />
                </View>
              </View>
            )}
          </BlurView>
        </View>

        {user && (
        <>
        {/* Travelers — collapsed, tap to expand */}
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
            <Row
              icon={<User size={16} color={t.fgMuted} />}
              title="Saved travelers"
              sub={`${USER.travelers.length} people`}
              onPress={() => setTravelersOpen((v) => !v)}
              last={!travelersOpen}
              right={
                travelersOpen ? (
                  <ChevronDown size={16} color={t.fgFaint} />
                ) : (
                  <ChevronRight size={16} color={t.fgFaint} />
                )
              }
            />
            {travelersOpen &&
              USER.travelers.map((tr, i) => (
                <Row
                  key={tr.id}
                  icon={<User size={16} color={t.fgMuted} />}
                  title={tr.name}
                  sub={`${tr.relation} · ${tr.dob}`}
                  right={<ChevronRight size={16} color={t.fgFaint} />}
                  last={i === USER.travelers.length - 1}
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
            {USER.payment.map((p, i) => (
              <Row
                key={p.id}
                icon={<CreditCard size={16} color={t.fgMuted} />}
                title={`${p.brand} •• ${p.last4}`}
                sub={`Exp ${p.exp}${p.primary ? ' · Primary' : ''}`}
                right={<ChevronRight size={16} color={t.fgFaint} />}
                last={i === USER.payment.length - 1}
              />
            ))}
          </View>
        </View>
        </>
        )}

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
            <Row
              icon={<ShieldCheck size={16} color={t.fgMuted} />}
              title="Demo: Admin mode"
              sub="Reveal the admin panel"
              last
              right={
                <Switch
                  value={isAdmin}
                  onValueChange={setAdmin}
                  trackColor={{ false: t.bgSunken, true: t.primary }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        {/* Account & support */}
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
            Account & support
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
            {isAdmin && (
              <Row
                icon={<ShieldCheck size={16} color={t.primary} />}
                title="Admin panel"
                sub="Users · notifications · currency"
                onPress={() => router.push('/admin')}
                right={<ChevronRight size={16} color={t.fgFaint} />}
              />
            )}
            <Row
              icon={<Receipt size={16} color={t.fgMuted} />}
              title="Order history"
              sub="eSIMs, stays, flights"
              onPress={() => router.push('/orders')}
              right={<ChevronRight size={16} color={t.fgFaint} />}
            />
            <Row
              icon={<MessageCircle size={16} color={t.fgMuted} />}
              title="Support"
              sub="Chat with us on WhatsApp"
              onPress={() => Linking.openURL('https://wa.me/9647507201111')}
              right={<ChevronRight size={16} color={t.fgFaint} />}
              last
            />
          </View>
        </View>

        {user && (
          <Pressable
            onPress={signOut}
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
        )}

        {/* Footer */}
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4, gap: 2 }}>
          <Text style={{ fontSize: 11, color: t.fgFaint }}>Brought to you by</Text>
          <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 14, color: t.fgMuted, letterSpacing: -0.2 }}>
            Corevia Network
          </Text>
        </View>
      </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
}
