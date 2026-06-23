import type { DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import { serviceRoute } from '@/data/services';
import { useIsWideWeb } from '@/lib/responsive';

export function useServices() {
  const router = useRouter();
  const isWide = useIsWideWeb();
  const colPct: DimensionValue = isWide ? '33.333%' : '50%';

  return {
    isWide,
    colPct,
    openService: (id: string) => router.push(serviceRoute(id) as any),
  };
}
