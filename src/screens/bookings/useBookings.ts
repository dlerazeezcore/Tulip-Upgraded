import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEsimStore } from '@/state/esimStore';
import { useIsWideWeb } from '@/lib/responsive';

export function useBookings() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const isWide = useIsWideWeb();
  const esims = useEsimStore((s) => s.esims);

  // eSIM is the only live service today; its counts are real (from the store).
  const esimSummary = useMemo(() => {
    const active = esims.filter((e) => e.status === 'active').length;
    return {
      count: esims.length,
      sub: active > 0 ? tr('bookings.active', { count: active }) : esims.length ? tr('bookings.noneActive') : tr('bookings.noneYet'),
    };
  }, [esims, tr]);

  return {
    isWide,
    esimSummary,
    openManage: (id: string) => router.push(`/manage/${id}`),
  };
}
