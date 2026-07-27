import { useState } from 'react';
import { Alert, Linking, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/state/themeStore';
import { useCurrencyStore } from '@/state/currencyStore';
import { useAuthStore } from '@/state/authStore';
import { useLocaleStore } from '@/state/localeStore';
import { useTravelersStore } from '@/state/travelersStore';
import { PRIVACY_URL, SUPPORT_WHATSAPP_URL } from '@/lib/config';

export function useProfile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const twoCol = Platform.OS === 'web' && width >= 1024;
  const { t: tr } = useTranslation();

  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const currencyCode = useCurrencyStore((s) => s.code);
  const language = useLocaleStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const signOutEverywhereAction = useAuthStore((s) => s.signOutEverywhere);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const setNotificationsEnabled = useAuthStore((s) => s.setNotificationsEnabled);
  const travelerCount = useTravelersStore((s) => s.travelers.length);

  const isAdmin = !!user?.isAdmin;
  const isLoyalty = !!user?.isLoyalty;
  // Saved travelers are tied to app-user rows; admin subjects have none and
  // every /travelers/my call 403s for them — hide the entry rather than
  // dead-ending admins on an erroring screen.
  const showTravelers = !!user && !isAdmin;
  const notificationsOn = user?.notificationsEnabled !== false; // default ON
  const memberSince = user?.createdAt ? String(new Date(user.createdAt).getFullYear()) : null;

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const openEdit = () => {
    setEditName(user?.name ?? '');
    setEditEmail(user?.email ?? '');
    setEditError(null);
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const saveProfile = async () => {
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

  const removeAccount = async () => {
    if (editBusy || deleteBusy) return;
    // FE-13: the destructive path gets its own busy flag so it doesn't flip the
    // "Save changes" button into a spinner, and lands on a neutral destination
    // (deleteAccount signs the user out, so re-navigating to the same profile
    // tab reused the stale edit-modal context).
    setDeleteBusy(true);
    setEditError(null);
    try {
      await deleteAccount();
      setEditOpen(false);
      router.replace('/(tabs)');
    } catch (e: any) {
      setEditError(e?.message || tr('profile.couldNotDelete'));
    } finally {
      setDeleteBusy(false);
    }
  };

  const setNotifications = (next: boolean) => {
    // The store reverts the optimistic toggle on failure; tell the user why
    // their switch snapped back instead of failing silently.
    setNotificationsEnabled(next).catch((e: any) => {
      Alert.alert(tr('common.error'), e?.message || tr('profile.notifUpdateFailed'));
    });
  };

  return {
    // layout + data
    twoCol,
    user,
    isAdmin,
    isLoyalty,
    showTravelers,
    notificationsOn,
    memberSince,
    travelerCount,
    currencyCode,
    language,
    isDark: mode === 'dark',
    // edit-modal state
    editOpen,
    editName,
    editEmail,
    editBusy,
    editError,
    deleteBusy,
    setEditName,
    setEditEmail,
    // actions
    toggleTheme,
    signOut,
    /** Ends the session on every device, not just this one — for a lost or stolen
     *  phone. Confirmed first, since it cannot be undone from the other devices. */
    signOutEverywhere: () => {
      Alert.alert(
        tr('profile.signOutEverywhereTitle'),
        tr('profile.signOutEverywhereBody'),
        [
          { text: tr('common.cancel'), style: 'cancel' },
          {
            text: tr('profile.signOutEverywhere'),
            style: 'destructive',
            onPress: () => {
              signOutEverywhereAction().catch(() => {});
            },
          },
        ],
      );
    },
    openEdit,
    closeEdit,
    saveProfile,
    deleteAccount: removeAccount,
    setNotifications,
    // navigation
    goTravelers: () => router.push('/travelers'),
    goAdmin: () => router.push('/admin'),
    goOrders: () => router.push('/orders'),
    goSignIn: () => router.push('/auth/sign-in'),
    goSignUp: () => router.push('/auth/sign-up'),
    openSupport: () => Linking.openURL(SUPPORT_WHATSAPP_URL),
    openPrivacy: () => Linking.openURL(PRIVACY_URL),
  };
}
