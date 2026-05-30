// Wiring for the "send custom notification" admin screen.
// Owns: audience picker, 3-language form state, validation, submission.
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
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

export const AUDIENCE_OPTIONS: AudienceOption[] = [
  { value: 'all', label: 'All users', subtitle: 'Every active app user device' },
  { value: 'authenticated', label: 'Signed-in users', subtitle: 'Authenticated app users' },
  { value: 'loyalty', label: 'Loyalty members', subtitle: 'Users flagged loyalty' },
  { value: 'active_esim', label: 'Active eSIM holders', subtitle: 'Users with an active or installed eSIM' },
];

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
  send: () => void;
};

export function useCustomNotification(): CustomNotificationViewModel {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);

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
      return 'English title and body are required (used as fallback).';
    }
    return null;
  }, [form]);

  const canSend = validationError === null && !sending;

  const audienceLabel = useMemo(
    () => AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? audience,
    [audience],
  );

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
      setError(e?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const send = () => {
    if (validationError) {
      Alert.alert('Missing info', validationError);
      return;
    }
    Alert.alert(
      `Send to ${audienceLabel}?`,
      'This will be delivered to every active device in this audience in their own language.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', style: 'destructive', onPress: performSend },
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
    audienceOptions: AUDIENCE_OPTIONS,
    form,
    setField,
    copyFromEn,
    langs: SUPPORTED_LANGS.map((code) => ({ code, label: LANG_LABELS[code] })),
    canSend,
    validationError,
    sending,
    error,
    lastDelivery,
    send,
  };
}
