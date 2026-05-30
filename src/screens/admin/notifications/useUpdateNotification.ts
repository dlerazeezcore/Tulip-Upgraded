// Wiring for the "send update notification" admin screen.
// Owns:
//   - Loading current version-info (so the right store URLs are sent).
//   - The pre-baked 3-language preview (mirrored from the backend templates).
//   - The send action — confirmation + error handling + success summary.
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/state/authStore';
import {
  getAppVersionInfo,
  sendAppUpdate,
} from '@/services/admin';
import { APP_UPDATE_TEMPLATES, LANG_LABELS, SUPPORTED_LANGS, SupportedLang } from '@/data/notificationTemplates';
import type { AppVersionInfo, PushDeliverySummary } from '@/services/types';

export type UpdateNotificationViewModel = {
  isAdmin: boolean;
  goBack: () => void;
  versionInfo: AppVersionInfo | null;
  loadingVersion: boolean;
  preview: { lang: SupportedLang; label: string; title: string; body: string }[];
  selectedLang: SupportedLang;
  setSelectedLang: (lang: SupportedLang) => void;
  sending: boolean;
  lastDelivery: PushDeliverySummary | null;
  error: string | null;
  send: () => void;
};

export function useUpdateNotification(): UpdateNotificationViewModel {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);

  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(true);
  const [selectedLang, setSelectedLang] = useState<SupportedLang>('en');
  const [sending, setSending] = useState(false);
  const [lastDelivery, setLastDelivery] = useState<PushDeliverySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingVersion(true);
    getAppVersionInfo()
      .then(setVersionInfo)
      .catch(() => {})
      .finally(() => setLoadingVersion(false));
  }, [isAdmin]);

  const preview = SUPPORTED_LANGS.map((lang) => ({
    lang,
    label: LANG_LABELS[lang],
    title: APP_UPDATE_TEMPLATES[lang].title,
    body: APP_UPDATE_TEMPLATES[lang].body,
  }));

  const performSend = async () => {
    setSending(true);
    setError(null);
    setLastDelivery(null);
    try {
      const res = await sendAppUpdate({
        appStoreUrl: versionInfo?.appStoreUrl || undefined,
        playStoreUrl: versionInfo?.playStoreUrl || undefined,
      });
      setLastDelivery(res.delivery);
    } catch (e: any) {
      setError(e?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const send = () => {
    Alert.alert(
      'Send to all users?',
      'Every user with notifications enabled will receive the update message in their language.',
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
    versionInfo,
    loadingVersion,
    preview,
    selectedLang,
    setSelectedLang,
    sending,
    lastDelivery,
    error,
    send,
  };
}
