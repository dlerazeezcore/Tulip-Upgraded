// Wiring for the admin notifications landing card list.
// Owns: admin-gate flag, the navigation routes, and the card metadata
// (titles/subtitles localized here; colors from the accent token palette).
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, History, Send, User } from 'lucide-react-native';
import { useAuthStore } from '@/state/authStore';
import { useTheme } from '@/theme/ThemeContext';

export type NotifLandingCard = {
  id: string;
  title: string;
  subtitle: string;
  Icon: typeof Bell;
  color: string;
  route: string;
};

export type NotificationsLandingViewModel = {
  isAdmin: boolean;
  goBack: () => void;
  cards: NotifLandingCard[];
};

export function useNotificationsLanding(): NotificationsLandingViewModel {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const t = useTheme();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);

  const cards: NotifLandingCard[] = [
    {
      id: 'update',
      title: tr('admin.notifications.landing.cards.update.title'),
      subtitle: tr('admin.notifications.landing.cards.update.subtitle'),
      Icon: Bell,
      color: t.accent.purple,
      route: '/admin/notifications/update',
    },
    {
      id: 'user',
      title: tr('admin.notifications.landing.cards.user.title'),
      subtitle: tr('admin.notifications.landing.cards.user.subtitle'),
      Icon: User,
      color: t.accent.blue,
      route: '/admin/notifications/user',
    },
    {
      id: 'custom',
      title: tr('admin.notifications.landing.cards.custom.title'),
      subtitle: tr('admin.notifications.landing.cards.custom.subtitle'),
      Icon: Send,
      color: t.accent.sky,
      route: '/admin/notifications/custom',
    },
    {
      id: 'history',
      title: tr('admin.notifications.landing.cards.history.title'),
      subtitle: tr('admin.notifications.landing.cards.history.subtitle'),
      Icon: History,
      color: t.accent.emerald,
      route: '/admin/notifications/history',
    },
  ];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/admin');
  };

  return { isAdmin, goBack, cards };
}
