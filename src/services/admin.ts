// Admin wiring: users list/update, orders, exchange-rate save, featured-locations CRUD,
// push notifications send/history, app version-info management.
import { apiFetch, unwrap } from '@/lib/api';
import type {
  AdminOrder,
  AdminSendAppUpdatePayload,
  AdminSendPushPayload,
  AdminSendResponse,
  AdminUserRow,
  AppVersionInfo,
  FeaturedLocationAdmin,
  PushNotificationRow,
} from './types';

export async function getUsers(params: { limit?: number; offset?: number; search?: string } = {}): Promise<AdminUserRow[]> {
  const res: any = await apiFetch('/api/v1/admin/users', { method: 'GET', query: params });
  return (res?.users ?? []) as AdminUserRow[];
}

export async function updateUser(
  id: string,
  patch: { isLoyalty?: boolean; blocked?: boolean; name?: string; status?: string },
): Promise<AdminUserRow> {
  const res: any = await apiFetch(`/api/v1/admin/users/${id}`, { method: 'PATCH', body: patch });
  return res.user as AdminUserRow;
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' });
}

export async function getAdminOrders(params: { month?: string } = {}): Promise<AdminOrder[]> {
  const res = await apiFetch('/api/v1/admin/orders/detailed', { method: 'GET', query: params });
  return unwrap<{ orders: AdminOrder[] }>(res).orders;
}

/** Save the active USD->IQD rate + markup% (markup stored in custom_fields). */
export async function saveExchangeRate(input: { rate: number; markupPercent: number }): Promise<void> {
  await apiFetch('/api/v1/admin/exchange-rates', {
    method: 'POST',
    body: {
      baseCurrency: 'USD',
      quoteCurrency: 'IQD',
      rate: input.rate,
      source: 'tulip-admin',
      active: true,
      customFields: { enableIQD: true, markupPercent: String(input.markupPercent) },
    },
  });
}

export async function listFeaturedLocations(): Promise<FeaturedLocationAdmin[]> {
  const res: any = await apiFetch('/api/v1/admin/featured-locations', { method: 'GET', query: { limit: 200 } });
  return (res?.locations ?? []) as FeaturedLocationAdmin[];
}

export async function saveFeaturedLocation(input: {
  code: string;
  name: string;
  sortOrder?: number;
  isPopular?: boolean;
  enabled?: boolean;
  locationType?: string;
}): Promise<void> {
  await apiFetch('/api/v1/admin/featured-locations', {
    method: 'POST',
    body: {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      serviceType: 'esim',
      locationType: input.locationType ?? 'country',
      sortOrder: input.sortOrder ?? 0,
      isPopular: input.isPopular ?? true,
      enabled: input.enabled ?? true,
    },
  });
}

export async function deleteFeaturedLocation(id: number): Promise<void> {
  await apiFetch(`/api/v1/admin/featured-locations/${id}`, { method: 'DELETE' });
}

// ─── Push notifications (admin) ─────────────────────────────────────────────

/**
 * Send a push notification. When `titles`/`bodies` are provided, the backend
 * fans the delivery out per language using each recipient's device locale.
 */
export function sendPushNotification(payload: AdminSendPushPayload): Promise<AdminSendResponse> {
  return apiFetch<AdminSendResponse>('/api/v1/admin/push-notifications/send', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Send the "new app version available" notification. Pass `appStoreUrl` /
 * `playStoreUrl` (or leave them out and the latest values from app/version-info
 * may be supplied by the caller). When `titles`/`bodies` are omitted the backend
 * uses its pre-baked APP_UPDATE_MESSAGES in EN/AR/KU.
 */
export function sendAppUpdate(payload: AdminSendAppUpdatePayload = {}): Promise<AdminSendResponse> {
  return apiFetch<AdminSendResponse>('/api/v1/admin/push-notifications/send-app-update', {
    method: 'POST',
    body: payload,
  });
}

export async function listPushNotifications(
  params: { limit?: number; offset?: number } = {},
): Promise<PushNotificationRow[]> {
  const res: any = await apiFetch('/api/v1/admin/push-notifications', {
    method: 'GET',
    query: params,
  });
  return (res?.notifications ?? []) as PushNotificationRow[];
}

// ─── App release info ───────────────────────────────────────────────────────

export type RefreshOrdersResult = {
  attempted: number;
  activeRefreshed: number;
  placeholdersRecovered: number;
  errorCount: number;
  errors?: { profileId?: number; orderNo?: string; iccid?: string; error?: string }[];
  ranAt?: string;
};

/**
 * Trigger an immediate provider sync for every ACTIVE eSIM profile + recovery
 * pass for recent broken-placeholder profiles. Same logic as the 30-min cron,
 * but admin-auth'd so the admin Orders page can call it on demand.
 *
 * Takes ~5-30s depending on how many profiles exist. The caller should show a
 * loading state while it runs.
 */
export function refreshOrdersFromProvider(): Promise<RefreshOrdersResult> {
  return apiFetch<RefreshOrdersResult>('/api/v1/admin/orders/refresh-from-provider', {
    method: 'POST',
  });
}

export function getAppVersionInfo(): Promise<AppVersionInfo> {
  return apiFetch<AppVersionInfo>('/api/v1/app/version-info', { method: 'GET', auth: false });
}

export function updateAppVersionInfo(payload: Partial<AppVersionInfo> & {
  releaseNotesEn?: string | null;
  releaseNotesAr?: string | null;
  releaseNotesKu?: string | null;
}): Promise<AppVersionInfo> {
  return apiFetch<AppVersionInfo>('/api/v1/admin/app/version-info', {
    method: 'PUT',
    body: payload,
  });
}
