import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import i18n, { Lang, RTL_LANGS } from '@/i18n';

function applyDirection(lang: Lang) {
  const rtl = RTL_LANGS.includes(lang);
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  } else {
    try {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
    } catch {}
  }
}

type LocaleState = {
  language: Lang;
  onboarded: boolean;
  hydrated: boolean;
  setLanguage: (lang: Lang) => void;
  completeOnboarding: () => void;
  hydrate: () => Promise<void>;
};

const LANG_KEY = 'tulip.lang';
const ONBOARDED_KEY = 'tulip.onboarded';

export const useLocaleStore = create<LocaleState>((set) => ({
  language: 'en',
  onboarded: false,
  hydrated: false,
  setLanguage: (language) => {
    set({ language });
    i18n.changeLanguage(language);
    applyDirection(language);
    AsyncStorage.setItem(LANG_KEY, language).catch(() => {});
  },
  completeOnboarding: () => {
    set({ onboarded: true });
    AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
  },
  hydrate: async () => {
    try {
      const [lang, onboarded] = await Promise.all([
        AsyncStorage.getItem(LANG_KEY),
        AsyncStorage.getItem(ONBOARDED_KEY),
      ]);
      if (lang === 'en' || lang === 'ar' || lang === 'ku') {
        set({ language: lang });
        i18n.changeLanguage(lang);
        applyDirection(lang);
      }
      if (onboarded === '1') set({ onboarded: true });
    } catch {}
    set({ hydrated: true });
  },
}));
