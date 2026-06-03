import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Linking, useWindowDimensions, Platform, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Star, ChevronRight, User, Moon, Globe, Bell,
  Coins, MessageCircle, Receipt, ShieldCheck, UserCog, X, Trash2,
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
  const { t: tr } = useTranslation();
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const currencyCode = useCurrencyStore((s) => s.code);
  const language = useLocaleStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const isAdmin = !!user?.isAdmin;
  const travelerCount = useTravelersStore((s) => s.travelers.length);
  const setNotificationsEnabled = useAuthStore((s) => s.setNotificationsEnabled);
  const notificationsOn = user?.notificationsEnabled !== false; // default ON

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEdit = () => {
    setEditName(user?.name ?? '');
    setEditEmail(user?.email ?? '');
    setEditError(null);
    setEditOpen(true);
  };
  const onSaveProfile = async () => {
    if (editBusy) return;
    setEditBusy(true);
    setEditError(null);
    try {
      await updateProfile({ name: editName.trim(), email: editEmail.trim() || null });
      setEditOpen(false);
    } catch (e: any) {
      setEditError(e?.message || tr('profile.couldNotSave'));
    } finally {
      setEditBusy(false);
    }
  };
  const onDeleteAccount = async () => {
    if (editBusy) return;
    setEditBusy(true);
    try {
      await deleteAccount();
      setEditOpen(false);
      router.replace('/(tabs)/profile');
    } catch (e: any) {
      setEditError(e?.message || tr('profile.couldNotDelete'));
    } finally {
      setEditBusy(false);
    }
  };
  const memberSince = user?.createdAt
    ? String(new Date(user.createdAt).getFullYear())
    : null;
  const tierLabel = user?.isLoyalty ? tr('profile.loyalty') : tr('profile.member');

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
                  {tierLabel}{memberSince ? ` · ${tr('profile.memberSince', { year: memberSince })}` : ''}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 22, color: '#fff', letterSpacing: -0.4 }}>{tr('profile.welcomeTitle')}</Text>
              <Text style={{ fontSize: 13, color: '#fff', opacity: 0.88, marginTop: 2 }}>{tr('profile.welcomeSub')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, maxWidth: 420 }}>
              <PrimaryButton label={tr('common.signIn')} onPress={() => router.push('/auth/sign-in')} style={{ flex: 1 }} />
              <PrimaryButton label={tr('common.signUp')} onPress={() => router.push('/auth/sign-up')} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.22)' }} />
            </View>
          </View>
        )}
      </BlurView>
    </View>
  );

  // ─── Sections ───
  const travelersSection = (
    <Section label={tr('profile.travelers')}>
      <Row
        icon={<User size={16} color={t.fgMuted} />}
        title={tr('profile.savedTravelers')}
        sub={`${travelerCount} ${travelerCount === 1 ? tr('profile.person') : tr('profile.people')} · ${tr('profile.travelersSub')}`}
        onPress={() => router.push('/travelers')}
        last
        right={<ChevronRight size={16} color={t.fgFaint} />}
      />
    </Section>
  );

  const preferencesSection = (
    <Section label={tr('profile.preferences')}>
      <Row icon={<Moon size={16} color={t.fgMuted} />} title={tr('profile.darkMode')} sub={mode === 'dark' ? tr('profile.on') : tr('profile.off')} right={<Toggle value={mode === 'dark'} onChange={toggle} />} />
      <Row icon={<Coins size={16} color={t.fgMuted} />} title={tr('profile.currencyLabel')} sub={tr(`currency.${currencyCode}`)} right={<CurrencyPicker />} />
      <Row icon={<Globe size={16} color={t.fgMuted} />} title={tr('profile.languageLabel')} sub={LANG_LABEL[language]} right={<LanguagePicker />} />
      <Row
        icon={<Bell size={16} color={t.fgMuted} />}
        title={tr('profile.notifications')}
        sub={user ? (notificationsOn ? tr('profile.notifOn') : tr('profile.notifOff')) : tr('profile.notifSignIn')}
        last
        right={
          user ? (
            <Toggle
              value={notificationsOn}
              onChange={(next) => {
                setNotificationsEnabled(next).catch(() => {});
              }}
            />
          ) : (
            <ChevronRight size={16} color={t.fgFaint} />
          )
        }
      />
    </Section>
  );

  const accountSection = (
    <Section label={tr('profile.accountSupport')}>
      {user && (
        <Row icon={<UserCog size={16} color={t.fgMuted} />} title={tr('profile.editProfile')} sub={tr('profile.editProfileSub')} onPress={openEdit} right={<ChevronRight size={16} color={t.fgFaint} />} />
      )}
      {isAdmin && (
        <Row icon={<ShieldCheck size={16} color={t.primary} />} title={tr('profile.adminPanel')} sub={tr('profile.adminPanelSub')} onPress={() => router.push('/admin')} right={<ChevronRight size={16} color={t.fgFaint} />} />
      )}
      <Row icon={<Receipt size={16} color={t.fgMuted} />} title={tr('profile.orderHistory')} sub={tr('profile.orderHistorySub')} onPress={() => router.push('/orders')} right={<ChevronRight size={16} color={t.fgFaint} />} />
      <Row icon={<MessageCircle size={16} color={t.fgMuted} />} title={tr('profile.support')} sub={tr('profile.supportSub')} onPress={() => Linking.openURL('https://wa.me/9647507201111')} right={<ChevronRight size={16} color={t.fgFaint} />} last />
    </Section>
  );

  const editModal = (
    <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
      <Pressable onPress={() => setEditOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <Pressable style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('profile.editProfile')}</Text>
            <Pressable onPress={() => setEditOpen(false)}><X size={20} color={t.fgMuted} /></Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tr('profile.fullName')}</Text>
            <TextInput value={editName} onChangeText={setEditName} placeholder={tr('profile.yourName')} placeholderTextColor={t.fgFaint}
              style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: t.fg, fontFamily: t.font.bodyMedium }} />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tr('profile.emailOptional')}</Text>
            <TextInput value={editEmail} onChangeText={setEditEmail} placeholder={tr('auth.emailPlaceholder')} placeholderTextColor={t.fgFaint} autoCapitalize="none" keyboardType="email-address"
              style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: t.fg, fontFamily: t.font.bodyMedium }} />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tr('profile.phoneCannotChange')}</Text>
            <View style={{ backgroundColor: t.bgSunken, borderColor: t.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 }}>
              <Text style={{ fontSize: 15, color: t.fgMuted, fontFamily: t.font.bodyMedium }}>{user?.phone}</Text>
            </View>
          </View>

          {editError && <Text style={{ fontSize: 12, color: t.danger }}>{editError}</Text>}

          <PrimaryButton label={editBusy ? tr('profile.saving') : tr('profile.saveChanges')} onPress={onSaveProfile} />

          <Pressable onPress={onDeleteAccount} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 }}>
            <Trash2 size={15} color={t.danger} />
            <Text style={{ color: t.danger, fontWeight: '700', fontSize: 13 }}>{tr('profile.deleteAccount')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const signOutBtn = user ? (
    <Pressable
      onPress={signOut}
      style={({ pressed }) => ({ padding: 14, borderRadius: 14, borderColor: t.danger, borderWidth: 1.5, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}
    >
      <Text style={{ color: t.danger, fontWeight: '700', fontSize: 14 }}>{tr('common.signOut')}</Text>
    </Pressable>
  ) : null;

  const footer = (
    <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4, gap: 8 }}>
      <Pressable
        onPress={() => Linking.openURL('https://tulipbookings.com/privacy-policy.html')}
        hitSlop={8}
      >
        <Text style={{ fontSize: 12, color: t.fgMuted, textDecorationLine: 'underline' }}>
          {tr('profile.privacyPolicy')}
        </Text>
      </Pressable>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={{ fontSize: 11, color: t.fgFaint }}>{tr('profile.broughtToYouBy')}</Text>
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 14, color: t.fgMuted, letterSpacing: -0.2 }}>Corevia Network</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <AnimatedScreen>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20, maxWidth: twoCol ? 1080 : 900, width: '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title={tr('profile.title')} />
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
      {editModal}
    </SafeAreaView>
  );
}
