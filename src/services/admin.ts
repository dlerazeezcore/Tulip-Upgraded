// Admin wiring: users list, exchange-rate save, featured-locations CRUD.
import { apiFetch } from '@/lib/api';
import type { AdminUserRow, FeaturedLocationAdmin } from './types';

export async function getUsers(params: { limit?: number; offset?: number; search?: string } = {}): Promise<AdminUserRow[]> {
  const res: any = await apiFetch('/api/v1/admin/users', { method: 'GET', query: params });
  return (res?.users ?? []) as AdminUserRow[];
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
