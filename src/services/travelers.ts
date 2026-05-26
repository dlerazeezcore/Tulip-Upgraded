// Saved travelers wiring (user-scoped).
import { apiFetch, unwrap } from '@/lib/api';
import type { Traveler } from './types';

export type TravelerInput = { name: string; relation?: string | null; dob?: string | null };

export async function listTravelers(): Promise<Traveler[]> {
  const res = await apiFetch('/api/v1/travelers/my', { method: 'GET' });
  return unwrap<{ travelers: Traveler[] }>(res).travelers;
}

export async function createTraveler(input: TravelerInput): Promise<Traveler> {
  const res = await apiFetch('/api/v1/travelers/my', { method: 'POST', body: input });
  return unwrap<{ traveler: Traveler }>(res).traveler;
}

export async function updateTraveler(id: number, input: TravelerInput): Promise<Traveler> {
  const res = await apiFetch(`/api/v1/travelers/my/${id}`, { method: 'PATCH', body: input });
  return unwrap<{ traveler: Traveler }>(res).traveler;
}

export async function deleteTraveler(id: number): Promise<void> {
  await apiFetch(`/api/v1/travelers/my/${id}`, { method: 'DELETE' });
}
