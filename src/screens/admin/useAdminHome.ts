import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Users, Bell, Coins, MapPin, Receipt, Percent, Gift, type LucideIcon } from 'lucide-react-native';
import { useAuthStore } from '@/state/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { useIsWideWeb } from '@/lib/responsive';
import { getUsers, listFeaturedLocations } from '@/services/admin';

export type AdminCardVM = {
  id: string;
  title: string;
  sub: string;
  Icon: LucideIcon;
  color: string;
  route: string;
};

export function useAdminHome() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const t = useTheme();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const isWide = useIsWideWeb();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [featuredCount, setFeaturedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    getUsers({ limit: 200 }).then((u) => setUserCount(u.length)).catch(() => {});
    listFeaturedLocations().then((f) => setFeaturedCount(f.length)).catch(() => {});
  }, [isAdmin]);

  const cards: AdminCardVM[] = [
    { id: 'users', title: tr('admin.users.title'), sub: userCount === null ? tr('admin.users.subView') : tr('admin.users.subCount', { count: userCount }), Icon: Users, color: t.accent.blue, route: '/admin/users' },
    { id: 'orders', title: tr('admin.orders.title'), sub: tr('admin.orders.sub'), Icon: Receipt, color: t.accent.sky, route: '/admin/orders' },
    { id: 'featured', title: tr('admin.featured.title'), sub: featuredCount === null ? tr('admin.featured.subEdit') : tr('admin.featured.subCount', { count: featuredCount }), Icon: MapPin, color: t.accent.amber, route: '/admin/featured' },
    { id: 'notif', title: tr('admin.notif.title'), sub: tr('admin.notif.sub'), Icon: Bell, color: t.accent.purple, route: '/admin/notifications' },
    { id: 'cur', title: tr('admin.currency.title'), sub: tr('admin.currency.sub'), Icon: Coins, color: t.accent.emerald, route: '/admin/currency' },
    { id: 'pricing', title: tr('admin.pricing.title'), sub: tr('admin.pricing.sub'), Icon: Percent, color: t.accent.pink, route: '/admin/pricing' },
    { id: 'esimAssign', title: tr('admin.esimAssign.title'), sub: tr('admin.esimAssign.sub'), Icon: Gift, color: t.accent.teal, route: '/admin/esim-assign' },
  ];

  return {
    isAdmin,
    isWide,
    cards,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')),
    goRoute: (route: string) => router.push(route as any),
  };
}
