import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/state/authStore';
import { useIsWideWeb } from '@/lib/responsive';
import { getUsers, listFeaturedLocations } from '@/services/admin';

export function useAdminHome() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const isWide = useIsWideWeb();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [featuredCount, setFeaturedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    getUsers({ limit: 200 }).then((u) => setUserCount(u.length)).catch(() => {});
    listFeaturedLocations().then((f) => setFeaturedCount(f.length)).catch(() => {});
  }, [isAdmin]);

  return {
    isAdmin,
    isWide,
    userCount,
    featuredCount,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')),
    goRoute: (route: string) => router.push(route as any),
  };
}
