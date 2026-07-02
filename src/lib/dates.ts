import { useCallback } from 'react';
import { useLocaleStore } from '@/state/localeStore';

/** BCP-47 tags for the in-app languages. Dates must follow the language the
 *  user picked IN the app, not the device locale — a device set to English
 *  with the app in Arabic should still show Arabic dates. */
const LOCALE_TAGS: Record<string, string> = { en: 'en-US', ar: 'ar-IQ', ku: 'ckb-IQ' };

function tags(language: string): string[] {
  // Array form lets the JS engine fall back when it lacks locale data
  // (Sorani `ckb` is missing from most engines → neutral English).
  return [LOCALE_TAGS[language] ?? 'en-US', 'en-US'];
}

/** Localized date formatters driven by the active app language. */
export function useDateFormatters() {
  const language = useLocaleStore((s) => s.language);

  /** "Jun 12, 2026, 03:15 PM" style — order detail rows, receipts. */
  const formatDateTime = useCallback(
    (iso?: string | null): string => {
      if (!iso) return '—';
      const d = new Date(iso);
      if (!Number.isFinite(d.getTime())) return '—';
      try {
        return d.toLocaleString(tags(language), {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return d.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
    [language],
  );

  /** "June 2026" style — order-history month groups. */
  const formatMonthYear = useCallback(
    (iso?: string | null): string => {
      if (!iso) return '—';
      const d = new Date(iso);
      if (!Number.isFinite(d.getTime())) return '—';
      try {
        return d.toLocaleDateString(tags(language), { year: 'numeric', month: 'long' });
      } catch {
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      }
    },
    [language],
  );

  return { formatDateTime, formatMonthYear };
}
