// THIN UI — wiring lives in src/screens/profile/useProfile.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Star, User, Moon, Globe, Bell,
  Coins, MessageCircle, Receipt, ShieldCheck, UserCog, X, Trash2,
} from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { LanguagePicker } from '@/components/LanguagePicker';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Toggle } from '@/components/Toggle';
import { useProfile } from '@/screens/profile/useProfile';

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
  const { t: tr } = useTranslation();
  const vm = useProfile();
  const tierLabel = vm.isLoyalty ? tr('profile.loyalty') : tr('profile.member');

  // ─── Hero ───
  const hero = (
    <View style={{ borderRadius: t.radius.lg, overflow: 'hidden', ...t.shadow2 }}>
      {/* FE-19 / #17: a token-driven brand gradient (theme-adaptive, deeper in
          dark mode) instead of reusing the home tab's stock photo behind a
          hardcoded scrim. */}
      <LinearGradient
        colors={t.gradHero as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />
      <BlurView intensity={20} tint="dark" style={{ padding: 22 }}>
        {vm.user ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.onHero.fill, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: t.onHero.border }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 22, color: t.onPrimary, letterSpacing: -0.4 }}>{vm.user.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 20, color: t.onPrimary, letterSpacing: -0.4 }}>{vm.user.name}</Text>
              <Text style={{ fontSize: 12, color: t.onPrimary, opacity: 0.88 }}>{vm.user.email ?? vm.user.phone}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, backgroundColor: t.onHero.chip, borderRadius: 999 }}>
                <Star size={11} color={t.onPrimary} fill={t.onPrimary} />
                <Text style={{ color: t.onPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                  {tierLabel}{vm.memberSince ? ` · ${tr('profile.memberSince', { year: vm.memberSince })}` : ''}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 22, color: t.onPrimary, letterSpacing: -0.4 }}>{tr('profile.welcomeTitle')}</Text>
              <Text style={{ fontSize: 13, color: t.onPrimary, opacity: 0.88, marginTop: 2 }}>{tr('profile.welcomeSub')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, maxWidth: 420 }}>
              <PrimaryButton label={tr('common.signIn')} onPress={vm.goSignIn} style={{ flex: 1 }} />
              <PrimaryButton label={tr('common.signUp')} variant="ghostOnPrimary" onPress={vm.goSignUp} style={{ flex: 1 }} />
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
        sub={`${vm.travelerCount} ${vm.travelerCount === 1 ? tr('profile.person') : tr('profile.people')} · ${tr('profile.travelersSub')}`}
        onPress={vm.goTravelers}
        last
        right={<DirectionalChevron direction="forward" size={16} color={t.fgFaint} />}
      />
    </Section>
  );

  const preferencesSection = (
    <Section label={tr('profile.preferences')}>
      <Row icon={<Moon size={16} color={t.fgMuted} />} title={tr('profile.darkMode')} sub={vm.isDark ? tr('profile.on') : tr('profile.off')} right={<Toggle value={vm.isDark} onChange={vm.toggleTheme} />} />
      <Row icon={<Coins size={16} color={t.fgMuted} />} title={tr('profile.currencyLabel')} sub={tr(`currency.${vm.currencyCode}`)} right={<CurrencyPicker />} />
      <Row icon={<Globe size={16} color={t.fgMuted} />} title={tr('profile.languageLabel')} sub={LANG_LABEL[vm.language]} right={<LanguagePicker />} />
      <Row
        icon={<Bell size={16} color={t.fgMuted} />}
        title={tr('profile.notifications')}
        sub={vm.user ? (vm.notificationsOn ? tr('profile.notifOn') : tr('profile.notifOff')) : tr('profile.notifSignIn')}
        last
        right={
          vm.user ? (
            <Toggle value={vm.notificationsOn} onChange={vm.setNotifications} />
          ) : (
            <DirectionalChevron direction="forward" size={16} color={t.fgFaint} />
          )
        }
      />
    </Section>
  );

  const accountSection = (
    <Section label={tr('profile.accountSupport')}>
      {vm.user && (
        <Row icon={<UserCog size={16} color={t.fgMuted} />} title={tr('profile.editProfile')} sub={tr('profile.editProfileSub')} onPress={vm.openEdit} right={<DirectionalChevron direction="forward" size={16} color={t.fgFaint} />} />
      )}
      {vm.isAdmin && (
        <Row icon={<ShieldCheck size={16} color={t.primary} />} title={tr('profile.adminPanel')} sub={tr('profile.adminPanelSub')} onPress={vm.goAdmin} right={<DirectionalChevron direction="forward" size={16} color={t.fgFaint} />} />
      )}
      <Row icon={<Receipt size={16} color={t.fgMuted} />} title={tr('profile.orderHistory')} sub={tr('profile.orderHistorySub')} onPress={vm.goOrders} right={<DirectionalChevron direction="forward" size={16} color={t.fgFaint} />} />
      <Row icon={<MessageCircle size={16} color={t.fgMuted} />} title={tr('profile.support')} sub={tr('profile.supportSub')} onPress={vm.openSupport} right={<DirectionalChevron direction="forward" size={16} color={t.fgFaint} />} last />
    </Section>
  );

  const editModal = (
    <Modal visible={vm.editOpen} transparent animationType="slide" onRequestClose={vm.closeEdit}>
      <Pressable onPress={vm.closeEdit} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'flex-end' }}>
        <Pressable style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('profile.editProfile')}</Text>
            <Pressable onPress={vm.closeEdit} accessibilityRole="button" accessibilityLabel={tr('a11y.close')}><X size={20} color={t.fgMuted} /></Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tr('profile.fullName')}</Text>
            <TextInput value={vm.editName} onChangeText={vm.setEditName} placeholder={tr('profile.yourName')} placeholderTextColor={t.fgFaint}
              style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: t.fg, fontFamily: t.font.bodyMedium }} />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tr('profile.emailOptional')}</Text>
            <TextInput value={vm.editEmail} onChangeText={vm.setEditEmail} placeholder={tr('auth.emailPlaceholder')} placeholderTextColor={t.fgFaint} autoCapitalize="none" keyboardType="email-address"
              style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: t.fg, fontFamily: t.font.bodyMedium }} />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tr('profile.phoneCannotChange')}</Text>
            <View style={{ backgroundColor: t.bgSunken, borderColor: t.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 }}>
              <Text style={{ fontSize: 15, color: t.fgMuted, fontFamily: t.font.bodyMedium }}>{vm.user?.phone}</Text>
            </View>
          </View>

          {vm.editError && <Text style={{ fontSize: 12, color: t.danger }}>{vm.editError}</Text>}

          <PrimaryButton label={vm.editBusy ? tr('profile.saving') : tr('profile.saveChanges')} onPress={vm.saveProfile} />

          <Pressable onPress={vm.deleteAccount} disabled={vm.deleteBusy} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, opacity: vm.deleteBusy ? 0.5 : 1 }}>
            <Trash2 size={15} color={t.danger} />
            <Text style={{ color: t.danger, fontWeight: '700', fontSize: 13 }}>{tr('profile.deleteAccount')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const signOutBtn = vm.user ? (
    <Pressable
      onPress={vm.signOut}
      style={({ pressed }) => ({ padding: 14, borderRadius: 14, borderColor: t.danger, borderWidth: 1.5, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}
    >
      <Text style={{ color: t.danger, fontWeight: '700', fontSize: 14 }}>{tr('common.signOut')}</Text>
    </Pressable>
  ) : null;

  const footer = (
    <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4, gap: 8 }}>
      <Pressable
        onPress={vm.openPrivacy}
        hitSlop={12}
        accessibilityRole="button"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 }}
      >
        <Text style={{ fontSize: 12, color: t.fgMuted, textDecorationLine: 'underline' }}>
          {tr('profile.privacyPolicy')}
        </Text>
        <DirectionalChevron direction="forward" size={14} color={t.fgFaint} />
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
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20, maxWidth: vm.twoCol ? 1080 : 900, width: '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title={tr('profile.title')} />
          {hero}

          {vm.twoCol && vm.user ? (
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
              {vm.user && travelersSection}
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
