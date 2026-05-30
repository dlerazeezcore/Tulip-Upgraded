// Mirror of the backend's pre-baked "update available" copy in
// Backend/push_localization.py — APP_UPDATE_MESSAGES.
// Used by the admin update-notification screen to preview what gets sent.
// IMPORTANT: keep in sync with the backend. The backend is authoritative.

export type SupportedLang = 'en' | 'ar' | 'ku';

export type LocalizedTextPair = { title: string; body: string };

export const APP_UPDATE_TEMPLATES: Record<SupportedLang, LocalizedTextPair> = {
  en: {
    title: 'Update available 🌷',
    body: 'A new version of Tulip is ready. Tap to update for the smoothest experience.',
  },
  ar: {
    title: 'تحديث متوفر 🌷',
    body: 'إصدار جديد من توليب جاهز. اضغط للتحديث للحصول على أفضل تجربة.',
  },
  ku: {
    title: 'نوێکراوەیەک بەردەستە 🌷',
    body: 'وەشانێکی نوێی Tulip ئامادەیە. کلیک بکە بۆ نوێکردنەوە.',
  },
};

export const SUPPORTED_LANGS: SupportedLang[] = ['en', 'ar', 'ku'];

export const LANG_LABELS: Record<SupportedLang, string> = {
  en: 'English',
  ar: 'العربية',
  ku: 'کوردی',
};
