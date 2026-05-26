// The single place the app talks HTTP to the backend. Services build on this;
// UI never calls fetch directly.
import { API_BASE_URL } from './config';

let authToken: string | null = null;

/** Set/clear the bearer token used for authenticated requests (called by authStore). */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  payload?: unknown;
  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Attach the bearer token when available (default true). */
  auth?: boolean;
  query?: Record<string, QueryValue>;
  timeoutMs?: number;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return base;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `${base}?${parts.join('&')}` : base;
}

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, query, timeoutMs = 20000 } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new ApiError(
      aborted ? 'Request timed out. Please try again.' : 'Network error. Please check your connection.',
      0,
      aborted ? 'TIMEOUT' : 'NETWORK',
    );
  } finally {
    clearTimeout(timer);
  }

  const raw = await res.text();
  let data: any = undefined;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.message || (data.detail && (data.detail.message || data.detail)) || data.error)) ||
      `Request failed (${res.status})`;
    const code = data && (data.errorCode || (data.detail && data.detail.code));
    throw new ApiError(
      typeof message === 'string' ? message : `Request failed (${res.status})`,
      res.status,
      typeof code === 'string' ? code : undefined,
      data,
    );
  }

  return data as T;
}

/** Unwrap the backend's { success, data } envelope; pass through bare payloads. */
export function unwrap<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return payload.data as T;
  }
  return payload as T;
}
