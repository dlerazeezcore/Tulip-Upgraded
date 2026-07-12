// Wiring for the "send custom notification" admin screen.
// Owns: audience picker, 3-language form state, validation, submission.
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import { sendPushNotification } from '@/services/admin';
import { LANG_LABELS, SUPPORTED_LANGS, SupportedLang } from '@/data/notificationTemplates';
import type { AdminSendPushPayload, PushDeliverySummary } from '@/services/types';

type Audience = NonNullable<AdminSendPushPayload['audience']>;

type LangForm = Record<SupportedLang, { title: string; body: string }>;
const EMPTY_FORM: LangForm = {
  en: { title: '', body: '' },
  ar: { title: '', body: '' },
  ku: { title: '', body: '' },
};

export type AudienceOption = { value: Audience; label: string; subtitle: string };

const AUDIENCE_VALUES: Audience[] = ['all', 'authenticated', 'loyalty', 'active_esim'];

export type CustomNotificationViewModel = {
  isAdmin: boolean;
  goBack: () => void;
  audience: Audience;
  setAudience: (a: Audience) => void;
  audienceOptions: AudienceOption[];
  form: LangForm;
  setField: (lang: SupportedLang, field: 'title' | 'body', value: string) => void;
  copyFromEn: (lang: SupportedLang) => void;
  langs: { code: SupportedLang; label: string }[];
  canSend: boolean;
  validationError: string | null;
  sending: boolean;
  error: string | null;
  lastDelivery: PushDeliverySummary | null;
  /** Pre-formatted per-language delivery breakdown ("EN: 3 · AR: 1"), or null. */
  perLanguageLabel: string | null;
  send: () => void;
};

export function useCustomNotification(): CustomNotificationViewModel {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);

  const audienceOptions = useMemo<AudienceOption[]>(
    () =>
      AUDIENCE_VALUES.map((value) => ({
        value,
        label: tr(`admin.notifications.custom.audiences.${value}.label`),
        subtitle: tr(`admin.notifications.custom.audiences.${value}.subtitle`),
      })),
    [tr],
  );

  const [audience, setAudience] = useState<Audience>('all');
  const [form, setForm] = useState<LangForm>(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDelivery, setLastDelivery] = useState<PushDeliverySummary | null>(null);

  const setField = useCallback(
    (lang: SupportedLang, field: 'title' | 'body', value: string) => {
      setForm((prev) => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
    },
    [],
  );

  const copyFromEn = useCallback((lang: SupportedLang) => {
    setForm((prev) => ({ ...prev, [lang]: { title: prev.en.title, body: prev.en.body } }));
  }, []);

  const validationError = useMemo<string | null>(() => {
    if (!form.en.title.trim() || !form.en.body.trim()) {
      return tr('admin.notifications.validation.enRequired');
    }
    return null;
  }, [form, tr]);

  const canSend = validationError === null && !sending;

  const audienceLabel = useMemo(
    () => audienceOptions.find((o) => o.value === audience)?.label ?? audience,
    [audienceOptions, audience],
  );

  // Pre-formatted per-language delivery breakdown — the screen renders it as-is.
  const perLanguageLabel = useMemo(() => {
    if (!lastDelivery?.perLanguageCounts) return null;
    return Object.entries(lastDelivery.perLanguageCounts)
      .map(([lang, n]) => `${lang.toUpperCase()}: ${n}`)
      .join(' · ');
  }, [lastDelivery]);

  const performSend = async () => {
    setSending(true);
    setError(null);
    setLastDelivery(null);
    try {
      const titles: Record<string, string> = {};
      const bodies: Record<string, string> = {};
      for (const lang of SUPPORTED_LANGS) {
        const tt = form[lang].title.trim();
        const bb = form[lang].body.trim();
        if (tt) titles[lang] = tt;
        if (bb) bodies[lang] = bb;
      }
      const res = await sendPushNotification({
        title: form.en.title.trim(),
        body: form.en.body.trim(),
        titles,
        bodies,
        audience,
      });
      setLastDelivery(res.delivery);
    } catch (e: any) {
      setError(e?.message || tr('admin.notifications.errors.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const send = () => {
    if (validationError) {
      Alert.alert(tr('admin.notifications.alerts.missingInfo'), validationError);
      return;
    }
    Alert.alert(
      tr('admin.notifications.custom.confirmTitle', { audience: audienceLabel }),
      tr('admin.notifications.custom.confirmBody'),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        { text: tr('admin.notifications.send'), style: 'destructive', onPress: performSend },
      ],
    );
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/admin/notifications');
  };

  return {
    isAdmin,
    goBack,
    audience,
    setAudience,
    audienceOptions,
    form,
    setField,
    copyFromEn,
    langs: SUPPORTED_LANGS.map((code) => ({ code, label: LANG_LABELS[code] })),
    canSend,
    validationError,
    sending,
    error,
    lastDelivery,
    perLanguageLabel,
    send,
  };
}
