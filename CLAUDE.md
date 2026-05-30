# Tulip Booking — codebase conventions

## Thin UI, separate wiring (mandatory for new code)

Every screen and component is split into two files:

- **Thin UI file** — JSX only. No `useState` for business data, no API calls, no router pushes, no derived computation. It pulls a single hook for everything it needs and renders. Target: ~50 lines.
- **Sibling wiring file** — a hook that owns state, API calls, navigation, validation, error handling, toasts. Returns a typed view-model the UI destructures.

### Where each lives

| Kind | Thin UI | Wiring |
|---|---|---|
| Expo Router screen | `app/<route>/<screen>.tsx` | `src/screens/<area>/use<Screen>.ts` |
| Component | `src/components/<Foo>.tsx` | `src/components/use<Foo>.ts` (sibling) |
| Cross-screen state | — | `src/state/<thing>Store.ts` (zustand) |
| Network | — | `src/services/<domain>.ts` |
| Pure transforms | — | `src/lib/<thing>.ts` |
| Static data | — | `src/data/<thing>.ts` |

### Example — screen

```tsx
// app/admin/notifications/update.tsx — THIN UI ONLY
import { View, Text, Pressable } from 'react-native';
import { useUpdateNotification } from '@/screens/admin/notifications/useUpdateNotification';

export default function UpdateNotificationScreen() {
  const vm = useUpdateNotification();
  return (
    <View>
      <Text>{vm.previewEn}</Text>
      <Pressable onPress={vm.send} disabled={vm.sending}>
        <Text>{vm.sending ? 'Sending…' : 'Send to all users'}</Text>
      </Pressable>
    </View>
  );
}
```

```ts
// src/screens/admin/notifications/useUpdateNotification.ts — WIRING
import { useState } from 'react';
import { Alert } from 'react-native';
import { sendAppUpdate } from '@/services/admin';
import { APP_UPDATE_TEMPLATES } from '@/data/notificationTemplates';

export function useUpdateNotification() {
  const [sending, setSending] = useState(false);
  const send = async () => {
    setSending(true);
    try { await sendAppUpdate({}); Alert.alert('Sent'); }
    catch (e: any) { Alert.alert('Failed', e?.message); }
    finally { setSending(false); }
  };
  return {
    previewEn: APP_UPDATE_TEMPLATES.en.body,
    sending,
    send,
  };
}
```

### Existing files are grandfathered, but…

Some existing screens (e.g. `app/(tabs)/index.tsx`) currently mix UI and wiring. Don't refactor them as part of unrelated work, but when you DO touch one, extract the wiring into a sibling hook.

## Other conventions

- **i18n**: 3 locales — `en`, `ar`, `ku`. `ar` and `ku` are RTL. Use `useTranslation()` or read `useLocaleStore`.
- **Auth-gated routes**: check `useAuthStore((s) => s.user)`. Admin: `useAuthStore((s) => !!s.user?.isAdmin)`.
- **API**: always via `apiFetch` in `src/lib/api.ts`. Never raw `fetch`.
- **Push notifications**: backend uses Firebase Cloud Messaging directly (not Expo's push service). Token comes from `Notifications.getDevicePushTokenAsync()` (native FCM token), not `getExpoPushTokenAsync()`.
- **Device locale**: source of truth for push language is `push_devices.locale` (per-device), with `app_users.preferred_language` as fallback. Re-register the device on every language change.
