import { useRouter } from 'expo-router';

export function useHotelResults() {
  const router = useRouter();

  return {
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)')),
  };
}
