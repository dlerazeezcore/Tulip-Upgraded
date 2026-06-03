import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import ar from './locales/ar';
import ku from './locales/ku';

export type Lang = 'en' | 'ar' | 'ku';
export const RTL_LANGS: Lang[] = ['ar', 'ku']; // Arabic + Kurdish Sorani are RTL

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      ku: { translation: ku },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

/**
 * Localize a backend-supplied status code (e.g. "ACTIVE", "provider_waiting",
 * "BOOKED", order statuses) via the `status.*` namespace. Falls back to a
 * readable Title Case of the raw code when no translation exists. Note: this
 * reads the CURRENT language at call time — inside React components that must
 * re-render on language change, prefer `const { t } = useTranslation()` and
 * `t('status.' + code.toLowerCase())`.
 */
export function tStatus(code: string | null | undefined): string {
  if (!code) return '';
  const key = String(code).trim().toLowerCase();
  const full = `status.${key}`;
  const translated = i18n.t(full);
  if (translated === full) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return translated;
}

export default i18n;
