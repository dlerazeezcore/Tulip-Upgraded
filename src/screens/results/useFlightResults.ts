import { useRouter } from 'expo-router';
import { useSearchStore } from '@/state/searchStore';

export function useFlightResults() {
  const router = useRouter();
  const { from, to, departDate, returnDate, tripType } = useSearchStore();

  return {
    from,
    to,
    departDate,
    returnDate,
    tripType,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)')),
  };
}
