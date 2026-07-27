// Wiring for the "send to a specific user" admin screen.
// Owns: user search/list, selected user, 3-language form state, validation, submission.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { confirmAction, notify } from '@/lib/dialog';
import { useTranslation } from 'react-i18next';
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
  const { t: tr } = useTranslation();
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
    if (!selectedUser) return tr('admin.notifications.validation.pickUser');
    if (!form.en.title.trim() || !form.en.body.trim()) {
      return tr('admin.notifications.validation.enRequired');
    }
    return null;
  }, [selectedUser, form, tr]);

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
      setError(e?.message || tr('admin.notifications.errors.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    if (validationError || !selectedUser) {
      notify(
        tr('admin.notifications.alerts.missingInfo'),
        validationError || tr('admin.notifications.validation.completeForm'),
      );
      return;
    }
    const confirmed = await confirmAction({
      title: tr('admin.notifications.user.confirmTitle'),
      message: tr('admin.notifications.user.confirmBody', {
        // Phone-only signups have no name — fall back so this never reads
        // "Send to  (+964…)" with a hole in it.
        name: selectedUser.name?.trim() || selectedUser.phone,
        phone: selectedUser.phone,
      }),
      confirmLabel: tr('admin.notifications.send'),
      cancelLabel: tr('common.cancel'),
    });
    if (!confirmed) return;
    await performSend();
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
