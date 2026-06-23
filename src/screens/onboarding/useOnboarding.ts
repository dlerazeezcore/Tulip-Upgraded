import { useRouter } from 'expo-router';
import { useLocaleStore } from '@/state/localeStore';
import { useCurrencyStore } from '@/state/currencyStore';
import type { Lang } from '@/i18n';
import type { CurrencyCode } from '@/data/currency';

const LANGS: { id: Lang; native: string; sub: string }[] = [
  { id: 'en', native: 'English', sub: 'English' },
  { id: 'ar', native: 'العربية', sub: 'Arabic' },
  { id: 'ku', native: 'کوردی', sub: 'Kurdish (Sorani)' },
];

export function useOnboarding() {
  const router = useRouter();
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);
  const completeOnboarding = useLocaleStore((s) => s.completeOnboarding);
  const code = useCurrencyStore((s) => s.code);
  const setCode = useCurrencyStore((s) => s.setCode);
  const currencies = useCurrencyStore((s) => s.currencies);

  const onStart = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return {
    langs: LANGS,
    currencyList: currencies.filter((c) => c.enabled),
    language,
    setLanguage: (id: Lang) => setLanguage(id),
    code,
    setCode: (next: CurrencyCode) => setCode(next),
    onStart,
  };
}
