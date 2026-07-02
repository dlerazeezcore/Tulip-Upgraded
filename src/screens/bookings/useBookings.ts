import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LucideIcon } from 'lucide-react-native';
import { SERVICES } from '@/data/services';
import { useEsimStore } from '@/state/esimStore';
import { useIsWideWeb } from '@/lib/responsive';

export type BookingTileVM = {
  id: string;
  Icon: LucideIcon;
  color: string;
  tint: string;
  title: string;
  sub: string;
};

export function useBookings() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const isWide = useIsWideWeb();
  const esims = useEsimStore((s) => s.esims);

  // eSIM is the only live service today; its counts are real (from the store).
  const tiles = useMemo<BookingTileVM[]>(() => {
    const active = esims.filter((e) => e.status === 'active').length;
    const esimSub =
      active > 0 ? tr('bookings.active', { count: active }) : esims.length ? tr('bookings.noneActive') : tr('bookings.noneYet');
    return SERVICES.map((svc) => {
      const isEsim = svc.id === 'esim';
      return {
        id: svc.id,
        Icon: svc.Icon,
        color: svc.color,
        tint: svc.tint,
        title: isEsim
          ? tr('bookings.myEsims')
          : svc.id === 'hotels'
            ? tr('bookings.myStays')
            : tr('bookings.myService', { label: tr(`serviceNames.${svc.id}`) }),
        sub: isEsim
          ? `${esims.length} ${esims.length === 1 ? tr('bookings.item') : tr('bookings.items')} · ${esimSub}`
          : tr('bookings.comingSoon'),
      };
    });
  }, [esims, tr]);

  return {
    isWide,
    tiles,
    openManage: (id: string) => router.push(`/manage/${id}`),
  };
}
