import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { HOME_HERO_IMAGE, HOME_HERO_BLURHASH } from '@/data/home';
import { SERVICES, serviceRoute } from '@/data/services';
import { useSearchStore } from '@/state/searchStore';
import { useAuthStore } from '@/state/authStore';
import { useIsWideWeb } from '@/lib/responsive';

function greetingKeyForHour(h: number): string {
  if (h < 12) return 'home.goodMorning';
  if (h < 18) return 'home.goodAfternoon';
  return 'home.goodEvening';
}

export function useHome() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const activeService = useSearchStore((s) => s.activeService);
  const svc = SERVICES.find((s) => s.id === activeService)!;
  const user = useAuthStore((s) => s.user);
  // First word of the name, or the whole phone number when no name is set — a
  // phone has no "first word", and greeting someone by half their number would
  // look like a bug.
  const firstName = user?.name?.trim() ? user.name.trim().split(/\s+/)[0] : user?.displayName;
  const greeting = tr(greetingKeyForHour(new Date().getHours()));
  const isWide = useIsWideWeb();

  return {
    svc,
    firstName,
    greeting,
    isWide,
    hero: { image: HOME_HERO_IMAGE, blurhash: HOME_HERO_BLURHASH },
    openActiveSearch: () => router.push(serviceRoute(svc.id) as any),
    openServices: () => router.push('/services'),
  };
}
