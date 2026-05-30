// Wiring for the "send to a specific user" admin screen.
// Owns: user search/list, selected user, 3-language form state, validation, submission.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/state/authStore';
import { getUsers, sendPushNotification } from '@/services/admin';
import { LANG_LABELS, SUPPORTED_LANGS, SupportedLang } from '@/data/notificationTemplates';
import type { AdminUserRow, PushDeliverySummary } from '@/services/types';

type LangForm = Record<SupportedLang, { title: string; body: string }>;

const EMPTY_FORM: LangForm = {
  en: { title: '', body: '' },
  ar: { title: '', body: '' },
  ku: { title: '', body: '' },
};

export type SendToUserViewModel = {
  isAdmin: boolean;
  goBack: () => void;

  // User picker
  search: string;
  setSearch: (v: string) => void;
  users: AdminUserRow[];
  loadingUsers: boolean;
  selectedUser: AdminUserRow | null;
  selectUser: (u: AdminUserRow | null) => void;

  // Form
  form: LangForm;
  setField: (lang: SupportedLang, field: 'title' | 'body', value: string) => void;
  copyFromEn: (lang: SupportedLang) => void;
  langs: { code: SupportedLang; label: string }[];
  canSend: boolean;
  validationError: string | null;

  // Submission
  sending: boolean;
  error: string | null;
  lastDelivery: PushDeliverySummary | null;
  send: () => void;
};

export function useSendToUser(): SendToUserViewModel {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);

  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

  const [form, setForm] = useState<LangForm>(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDelivery, setLastDelivery] = useState<PushDeliverySummary | null>(null);

  // Initial + debounced search
  useEffect(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    const timer = setTimeout(() => {
      getUsers({ limit: 60, search: search.trim() || undefined })
        .then(setUsers)
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    }, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [isAdmin, search]);

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
    if (!selectedUser) return 'Pick a user first.';
    if (!form.en.title.trim() || !form.en.body.trim()) {
      return 'English title and body are required (used as fallback).';
    }
    return null;
  }, [selectedUser, form]);

  const canSend = validationError === null && !sending;

  const performSend = async () => {
    if (!selectedUser) return;
    setSending(true);
    setError(null);
    setLastDelivery(null);
    try {
      const titles: Record<string, string> = {};
      const bodies: Record<string, string> = {};
      for (const lang of SUPPORTED_LANGS) {
        const t = form[lang].title.trim();
        const b = form[lang].body.trim();
        if (t) titles[lang] = t;
        if (b) bodies[lang] = b;
      }
      const res = await sendPushNotification({
        title: form.en.title.trim(),
        body: form.en.body.trim(),
        titles,
        bodies,
        userIds: [selectedUser.id],
      });
      setLastDelivery(res.delivery);
    } catch (e: any) {
      setError(e?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const send = () => {
    if (validationError || !selectedUser) {
      Alert.alert('Missing info', validationError || 'Please complete the form.');
      return;
    }
    Alert.alert(
      'Send notification?',
      `${selectedUser.name} (${selectedUser.phone}) will receive this in their language.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: performSend },
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
    search,
    setSearch,
    users,
    loadingUsers,
    selectedUser,
    selectUser: setSelectedUser,
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
