// Wiring for <UpdateAvailableModal />.
//
// Owns:
//   - Subscribing to useUpdateStore (status + info).
//   - Picking the localized title/body (from i18n + server-side release notes).
//   - Resolving the platform-specific store URL.
//   - Wiring the "Update now" button to Linking + the "Later" button to store.dismiss.
//   - Triggering checkForUpdate on mount and on AppState → 'active'.
import { useEffect, useMemo } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { platformStoreUrl, useUpdateStore } from '@/state/updateStore';
import { useLocaleStore } from '@/state/localeStore';

export type UpdateModalViewModel = {
  visible: boolean;
  forced: boolean;
  title: string;
  body: string;
  notes: string | null;
  updateLabel: string;
  laterLabel: string;
  canDismiss: boolean;
  storeUrl: string | null;
  onUpdate: () => void;
  onDismiss: () => void;
};

export function useUpdateAvailableModal(): UpdateModalViewModel {
  const { t } = useTranslation();
  const status = useUpdateStore((s) => s.status);
  const info = useUpdateStore((s) => s.info);
  const dismissed = useUpdateStore((s) => s.dismissed);
  const checkForUpdate = useUpdateStore((s) => s.checkForUpdate);
  const dismiss = useUpdateStore((s) => s.dismiss);
  const lang = useLocaleStore((s) => s.language);

  // Check on mount + every time the app comes to foreground.
  useEffect(() => {
    checkForUpdate();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') checkForUpdate();
    });
    return () => sub.remove();
  }, [checkForUpdate]);

  // When the user taps an "app_update" push, surface the modal immediately
  // (the data.appStoreUrl/playStoreUrl from the push is informational; the modal
  // uses the canonical version-info from the backend).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener(
      (resp: Notifications.NotificationResponse) => {
        const data: any = resp?.notification?.request?.content?.data || {};
        const kind = String(data?.type || data?.kind || data?.notificationType || '').toLowerCase();
        if (kind === 'app_update') checkForUpdate();
      },
    );
    return () => sub.remove();
  }, [checkForUpdate]);

  const visible = useMemo(() => {
    if (status === 'forced') return true;
    if (status === 'optional') return !dismissed;
    return false;
  }, [status, dismissed]);

  const storeUrl = useMemo(() => platformStoreUrl(info), [info]);

  const notes = useMemo<string | null>(() => {
    if (!info) return null;
    const rn = info.releaseNotes || {};
    return (
      (lang === 'ar' && rn.ar) ||
      (lang === 'ku' && rn.ku) ||
      rn.en ||
      null
    );
  }, [info, lang]);

  const forced = status === 'forced';
  const title = t('update.title');
  const body = forced ? t('update.forcedBody') : t('update.body');

  const onUpdate = () => {
    if (!storeUrl) return;
    Linking.openURL(storeUrl).catch(() => {});
  };

  const onDismiss = () => {
    if (forced) return;
    dismiss();
  };

  return {
    visible,
    forced,
    title,
    body,
    notes,
    updateLabel: t('update.updateNow'),
    laterLabel: t('update.later'),
    canDismiss: !forced,
    storeUrl,
    onUpdate,
    onDismiss,
  };
}
