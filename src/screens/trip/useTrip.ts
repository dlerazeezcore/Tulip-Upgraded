import { useRouter } from 'expo-router';

// Trips are not a live feature yet — kept as a graceful placeholder so any
// stale/deep link doesn't surface mock trip data.
export function useTrip() {
  const router = useRouter();

  return {
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)')),
  };
}
