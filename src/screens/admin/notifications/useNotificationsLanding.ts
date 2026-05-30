// Wiring for the admin notifications landing card list.
// Owns: admin-gate flag, the navigation routes, and the card metadata.
import { useRouter } from 'expo-router';
import { Bell, History, Send, User } from 'lucide-react-native';
import { useAuthStore } from '@/state/authStore';

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
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);

  const cards: NotifLandingCard[] = [
    {
      id: 'update',
      title: 'Send update notification',
      subtitle: 'Pre-baked, localized to each user',
      Icon: Bell,
      color: '#7C3AED',
      route: '/admin/notifications/update',
    },
    {
      id: 'user',
      title: 'Send to a specific user',
      subtitle: 'Pick a user, compose in 3 languages',
      Icon: User,
      color: '#1967D2',
      route: '/admin/notifications/user',
    },
    {
      id: 'custom',
      title: 'Send custom notification',
      subtitle: 'Audience-targeted, 3-language',
      Icon: Send,
      color: '#0EA5E9',
      route: '/admin/notifications/custom',
    },
    {
      id: 'history',
      title: 'History',
      subtitle: 'Past sends + delivery counts',
      Icon: History,
      color: '#10B981',
      route: '/admin/notifications/history',
    },
  ];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/admin');
  };

  return { isAdmin, goBack, cards };
}
