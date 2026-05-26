import React from 'react';
import { ScrollView, View, Text, Pressable, Linking, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Star, ChevronRight, User, Moon, Globe, Bell,
  Coins, MessageCircle, Receipt, ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStore } from '@/state/themeStore';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { LanguagePicker } from '@/components/LanguagePicker';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Toggle } from '@/components/Toggle';
import { useCurrencyStore } from '@/state/currencyStore';
import { CURRENCIES } from '@/data/currency';
import { useAuthStore } from '@/state/authStore';
import { useLocaleStore } from '@/state/localeStore';
import { useTravelersStore } from '@/state/travelersStore';

const LANG_LABEL: Record<string, string> = { en: 'English', ar: 'العربية', ku: 'کوردی' };

function Row({
  icon, title, sub, right, onPress, last,
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
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomColor: t.border,
        borderBottomWidth: last ? 0 : 1,
      }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '600', fontSize: 14, color: t.fg }}>{title}</Text>
        {sub && <Text style={{ fontSize: 11, color: t.fgMuted, marginTop: 2 }}>{sub}</Text>}
      </View>
      {right}
    </Container>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, paddingHorizontal: 4 }}>
        {label}
      </Text>
      <View style={{ backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden', ...t.shadow1 }}>
        {children}
      </View>
    </View>
  );
}

export default function Profile() {
  const t = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const twoCol = Platform.OS === 'web' && width >= 1024;
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const currencyName = CURRENCIES[useCurrencyStore((s) => s.code)].name;
  const language = useLocaleStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isAdmin = !!user?.isAdmin;
  const travelerCount = useTravelersStore((s) => s.travelers.length);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
    : null;
  const tierLabel = user?.isLoyalty ? 'Loyalty' : 'Member';

  // ─── Hero ───
  const hero = (
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
      <BlurView intensity={20} tint="dark" style={{ padding: 22 }}>
        {user ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 22, color: '#fff', letterSpacing: -0.4 }}>{user.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 20, color: '#fff', letterSpacing: -0.4 }}>{user.name}</Text>
              <Text style={{ fontSize: 12, color: '#fff', opacity: 0.88 }}>{user.email ?? user.phone}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 999 }}>
                <Star size={11} color="#fff" fill="#fff" />
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                  {tierLabel}{memberSince ? ` · Member since ${memberSince}` : ''}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 22, color: '#fff', letterSpacing: -0.4 }}>Welcome to Tulip</Text>
              <Text style={{ fontSize: 13, color: '#fff', opacity: 0.88, marginTop: 2 }}>Sign in to manage bookings, eSIMs and more.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, maxWidth: 420 }}>
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} style={{ flex: 1 }} />
              <PrimaryButton label="Sign up" onPress={() => router.push('/auth/sign-up')} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.22)' }} />
            </View>
          </View>
        )}
      </BlurView>
    </View>
  );

  // ─── Sections ───
  const travelersSection = (
    <Section label="Travelers">
      <Row
        icon={<User size={16} color={t.fgMuted} />}
        title="Saved travelers"
        sub={`${travelerCount} ${travelerCount === 1 ? 'person' : 'people'} · add, edit or remove`}
        onPress={() => router.push('/travelers')}
        last
        right={<ChevronRight size={16} color={t.fgFaint} />}
      />
    </Section>
  );

  const preferencesSection = (
    <Section label="Preferences">
      <Row icon={<Moon size={16} color={t.fgMuted} />} title="Dark mode" sub={mode === 'dark' ? 'On' : 'Off'} right={<Toggle value={mode === 'dark'} onChange={toggle} />} />
      <Row icon={<Coins size={16} color={t.fgMuted} />} title="Currency" sub={currencyName} right={<CurrencyPicker />} />
      <Row icon={<Globe size={16} color={t.fgMuted} />} title="Language" sub={LANG_LABEL[language]} right={<LanguagePicker />} />
      <Row icon={<Bell size={16} color={t.fgMuted} />} title="Notifications" sub="Trip alerts, deals" last right={<ChevronRight size={16} color={t.fgFaint} />} />
    </Section>
  );

  const accountSection = (
    <Section label="Account & support">
      {isAdmin && (
        <Row icon={<ShieldCheck size={16} color={t.primary} />} title="Admin panel" sub="Users · notifications · currency" onPress={() => router.push('/admin')} right={<ChevronRight size={16} color={t.fgFaint} />} />
      )}
      <Row icon={<Receipt size={16} color={t.fgMuted} />} title="Order history" sub="eSIMs, stays, flights" onPress={() => router.push('/orders')} right={<ChevronRight size={16} color={t.fgFaint} />} />
      <Row icon={<MessageCircle size={16} color={t.fgMuted} />} title="Support" sub="Chat with us on WhatsApp" onPress={() => Linking.openURL('https://wa.me/9647507201111')} right={<ChevronRight size={16} color={t.fgFaint} />} last />
    </Section>
  );

  const signOutBtn = user ? (
    <Pressable
      onPress={signOut}
      style={({ pressed }) => ({ padding: 14, borderRadius: 14, borderColor: t.danger, borderWidth: 1.5, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}
    >
      <Text style={{ color: t.danger, fontWeight: '700', fontSize: 14 }}>Sign out</Text>
    </Pressable>
  ) : null;

  const footer = (
    <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4, gap: 2 }}>
      <Text style={{ fontSize: 11, color: t.fgFaint }}>Brought to you by</Text>
      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 14, color: t.fgMuted, letterSpacing: -0.2 }}>Corevia Network</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20, maxWidth: twoCol ? 1080 : 900, width: '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Profile" />
          {hero}

          {twoCol && user ? (
            <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 20 }}>
                {travelersSection}
                {preferencesSection}
              </View>
              <View style={{ flex: 1, gap: 20 }}>
                {accountSection}
                {signOutBtn}
              </View>
            </View>
          ) : (
            <>
              {user && travelersSection}
              {preferencesSection}
              {accountSection}
              {signOutBtn}
            </>
          )}

          {footer}
        </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
}
