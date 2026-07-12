import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSearchStore } from '@/state/searchStore';
import { useIsRTL } from '@/lib/rtl';

export function useFlightResults() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const isRTL = useIsRTL();
  const { from, to, departDate, returnDate, tripType } = useSearchStore();

  // "Erbil → Istanbul" (arrow mirrored for RTL). StackHeader's title is a
  // plain string, so directional intent is a character here instead of
  // <DirectionalArrow/> — keep them visually in sync if either changes.
  const fromCity = (from || tr('results.flightsTitle')).split(' · ')[0];
  const title = to ? `${fromCity} ${isRTL ? '←' : '→'} ${to.split(' · ')[0]}` : fromCity;
  const subtitle = departDate
    ? `${departDate}${tripType === 'roundtrip' && returnDate ? ` – ${returnDate}` : ''}`
    : null;

  return {
    title,
    subtitle,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)')),
  };
}
