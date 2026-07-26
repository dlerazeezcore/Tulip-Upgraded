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

/**
 * Set (or reset) an app user's password from the admin panel. Works whether or not
 * the user already had one — a WhatsApp/OTP-only signup starts with none.
 *
 * The plaintext is sent once and never echoed back. Note this does NOT sign the
 * user out of existing sessions (bearer tokens have no revocation list); to cut
 * off access, block the account as well.
 */
export async function setUserPassword(id: string, password: string): Promise<AdminUserRow> {
  const res: any = await apiFetch(`/api/v1/admin/users/${id}/password`, {
    method: 'POST',
    body: { password },
  });
  return res.user as AdminUserRow;
}

export async function getAdminOrders(params: { month?: string } = {}): Promise<AdminOrder[]> {
  const res = await apiFetch('/api/v1/admin/orders/detailed', { method: 'GET', query: params });
  return unwrap<{ orders: AdminOrder[] }>(res).orders;
}

/**
 * Save (add or update) a UNIVERSAL display-currency FX rate — `rate` is IQD per
 * 1 unit (e.g. 1 USD = 1550 IQD). Presentation metadata rides in customFields.
 * The exchange rate is currency-only (no markup): markup is service-scoped.
 */
export async function saveCurrencyRate(input: {
  code: string;
  rate: number;
  symbol?: string;
  name?: string;
  decimals?: number;
  position?: 'prefix' | 'suffix';
  flag?: string;
  enabled?: boolean;
}): Promise<void> {
  await apiFetch('/api/v1/admin/exchange-rates', {
    method: 'POST',
    body: {
      baseCurrency: input.code.trim().toUpperCase(),
      quoteCurrency: 'IQD',
      rate: input.rate,
      source: 'tulip-admin',
      active: true,
      customFields: {
        symbol: input.symbol,
        name: input.name,
        decimals: input.decimals,
        position: input.position,
        flag: input.flag,
        enabled: input.enabled ?? true,
      },
    },
  });
}

/**
 * Save the GLOBAL eSIM markup % as a service-scoped pricing rule — the
 * future-ready home (per-country / per-package / per-class rules slot in the
 * same way, no code change). The backend deactivates the previous global eSIM
 * rule so this is an upsert.
 */
export async function saveEsimMarkup(markupPercent: number): Promise<void> {
  await savePricingRule({ ruleScope: 'global', type: 'percent', value: markupPercent });
}

// ─── eSIM pricing & discount rules (per-country / per-bundle overrides) ──────
// The engine applies the single MOST-SPECIFIC active rule (package > country >
// provider > global); rules never stack. So a country/bundle rule overrides the
// general for that country/bundle and the general still applies to the rest.

export type RuleScope = 'global' | 'country' | 'package' | 'provider';
// 'absolute' (markup only) = set the exact final sale price. Discounts use only percent|fixed.
export type AdjustmentType = 'percent' | 'fixed' | 'absolute';

export type RuleCustomFields = { label?: string; slug?: string } | null;

export type AdminPricingRule = {
  id: number;
  service_type: string;
  rule_scope: RuleScope;
  country_code: string | null;
  package_code: string | null;
  provider_code: string | null;
  adjustment_type: AdjustmentType;
  adjustment_value: number;
  applies_to: string;
  priority: number;
  active: boolean;
  custom_fields?: RuleCustomFields;
};

export type AdminDiscountRule = {
  id: number;
  service_type: string;
  rule_scope: RuleScope;
  country_code: string | null;
  package_code: string | null;
  provider_code: string | null;
  discount_type: AdjustmentType;
  discount_value: number;
  applies_to: string;
  priority: number;
  active: boolean;
  custom_fields?: RuleCustomFields;
};

export type RuleInput = {
  ruleScope: RuleScope;
  countryCode?: string | null;
  packageCode?: string | null;
  type: AdjustmentType;
  value: number;
  priority?: number;
  active?: boolean;
  /** Friendly label/slug for a bundle rule (so the admin list reads "Turkey 5GB · 30d"). */
  customFields?: Record<string, unknown>;
};

function scopedKeys(input: RuleInput, appliesTo: string) {
  return {
    serviceType: 'esim',
    ruleScope: input.ruleScope,
    countryCode: input.ruleScope === 'country' ? (input.countryCode || '').trim().toUpperCase() : null,
    packageCode: input.ruleScope === 'package' ? (input.packageCode || '').trim() : null,
    appliesTo,
    priority: input.priority ?? 100,
    active: input.active ?? true,
  };
}

export async function getPricingRules(): Promise<AdminPricingRule[]> {
  const res: any = await apiFetch('/api/v1/admin/pricing-rules', { method: 'GET', query: { limit: 200 } });
  return ((res?.pricingRules ?? res?.pricing_rules ?? []) as AdminPricingRule[]).filter((r) => r.service_type === 'esim');
}

export async function getDiscountRules(): Promise<AdminDiscountRule[]> {
  const res: any = await apiFetch('/api/v1/admin/discount-rules', { method: 'GET', query: { limit: 200 } });
  return ((res?.discountRules ?? res?.discount_rules ?? []) as AdminDiscountRule[]).filter((r) => r.service_type === 'esim');
}

export async function savePricingRule(input: RuleInput): Promise<void> {
  // Markup applies to the provider cost (cost → sale price).
  await apiFetch('/api/v1/admin/pricing-rules', {
    method: 'POST',
    body: { ...scopedKeys(input, 'provider_cost'), adjustmentType: input.type, adjustmentValue: input.value, customFields: input.customFields ?? {} },
  });
}

export async function saveDiscountRule(input: RuleInput): Promise<void> {
  // Discount comes off the marked-up item total (i.e. % off the sale price).
  await apiFetch('/api/v1/admin/discount-rules', {
    method: 'POST',
    body: { ...scopedKeys(input, 'item_total'), discountType: input.type, discountValue: input.value, customFields: input.customFields ?? {} },
  });
}

/** Remove a rule = upsert the same scope with active:false (backend deactivates the match). */
export function removePricingRule(rule: AdminPricingRule): Promise<void> {
  return savePricingRule({
    ruleScope: rule.rule_scope,
    countryCode: rule.country_code,
    packageCode: rule.package_code,
    type: rule.adjustment_type,
    value: rule.adjustment_value,
    priority: rule.priority,
    active: false,
  });
}

export function removeDiscountRule(rule: AdminDiscountRule): Promise<void> {
  return saveDiscountRule({
    ruleScope: rule.rule_scope,
    countryCode: rule.country_code,
    packageCode: rule.package_code,
    type: rule.discount_type,
    value: rule.discount_value,
    priority: rule.priority,
    active: false,
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
