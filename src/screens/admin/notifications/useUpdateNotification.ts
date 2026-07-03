// Wiring for the "publish update" admin screen.
// Owns:
//   - Loading current version-info (latest version + store URLs).
//   - The editable "latest version" field the admin publishes.
//   - The pre-baked 3-language preview (mirrored from the backend templates).
//   - The publish action — writes latestVersion to the backend (which BLOCKS
//     every older app build until it updates), then sends the push to all users.
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';
import {
  getAppVersionInfo,
  sendAppUpdate,
  updateAppVersionInfo,
} from '@/services/admin';
import { APP_UPDATE_TEMPLATES, LANG_LABELS, SUPPORTED_LANGS, SupportedLang } from '@/data/notificationTemplates';
import type { AppVersionInfo, PushDeliverySummary } from '@/services/types';

const VERSION_RE = /^\d+(\.\d+){0,3}$/;

export type UpdateNotificationViewModel = {
  isAdmin: boolean;
  goBack: () => void;
  versionInfo: AppVersionInfo | null;
  loadingVersion: boolean;
  latestVersion: string;
  setLatestVersion: (v: string) => void;
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
  const { t: tr } = useTranslation();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);

  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(true);
  const [latestVersion, setLatestVersion] = useState('');
  const [selectedLang, setSelectedLang] = useState<SupportedLang>('en');
  const [sending, setSending] = useState(false);
  const [lastDelivery, setLastDelivery] = useState<PushDeliverySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingVersion(true);
    getAppVersionInfo()
      .then((info) => {
        setVersionInfo(info);
        setLatestVersion(info.latestVersion || '');
      })
      .catch(() => {})
      .finally(() => setLoadingVersion(false));
  }, [isAdmin]);

  const preview = SUPPORTED_LANGS.map((lang) => ({
    lang,
    label: LANG_LABELS[lang],
    title: APP_UPDATE_TEMPLATES[lang].title,
    body: APP_UPDATE_TEMPLATES[lang].body,
  }));

  const performSend = async (version: string) => {
    setSending(true);
    setError(null);
    setLastDelivery(null);
    try {
      // Publish first: setting latestVersion is what blocks older builds.
      // Only then notify, so users are never pushed towards a version the
      // backend doesn't advertise yet.
      const info = await updateAppVersionInfo({ latestVersion: version });
      setVersionInfo(info);
      const res = await sendAppUpdate({
        appStoreUrl: info.appStoreUrl || undefined,
        playStoreUrl: info.playStoreUrl || undefined,
      });
      setLastDelivery(res.delivery);
    } catch (e: any) {
      setError(e?.message || tr('admin.notifications.errors.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const send = () => {
    const version = latestVersion.trim();
    if (!VERSION_RE.test(version)) {
      setError(tr('admin.notifications.update.invalidVersion'));
      return;
    }
    setError(null);
    Alert.alert(
      tr('admin.notifications.update.confirmTitle', { version }),
      tr('admin.notifications.update.confirmBody'),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        { text: tr('admin.notifications.update.confirmPublish'), style: 'destructive', onPress: () => performSend(version) },
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
    latestVersion,
    setLatestVersion,
    preview,
    selectedLang,
    setSelectedLang,
    sending,
    lastDelivery,
    error,
    send,
  };
}
