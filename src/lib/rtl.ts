import { I18nManager, Platform } from 'react-native';
import { RTL_LANGS } from '@/i18n';
import { useLocaleStore } from '@/state/localeStore';

/**
 * Whether the UI is currently rendered right-to-left.
 *
 * - Web mirrors layout immediately via `document.dir`, so the active language is
 *   the source of truth.
 * - Native only mirrors flex layout after `I18nManager.forceRTL` + an app
 *   restart, so we follow `I18nManager.isRTL` (the actually-applied direction) to
 *   keep directional glyphs consistent with the real layout. Subscribing to the
 *   language keeps the hook re-rendering when the locale changes.
 */
export function useIsRTL(): boolean {
  const language = useLocaleStore((s) => s.language);
  if (Platform.OS === 'web') return RTL_LANGS.includes(language);
  return I18nManager.isRTL;
}
