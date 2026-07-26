// The single place the app talks HTTP to the backend. Services build on this;
// UI never calls fetch directly.
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { API_BASE_URL } from './config';

// The running app build, reported on every request so the backend can record
// which version each user is on (admin panel "on latest?" column).
const APP_VERSION = String(
  Constants.expoConfig?.version || Application.nativeApplicationVersion || '',
).trim();

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
  /** Seconds to wait before retrying. Set for 429s (from the error body or the
   *  Retry-After header) so callers can render a countdown instead of a dead button. */
  retryAfterSeconds?: number;
  constructor(message: string, status: number, code?: string, payload?: unknown, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** True when the request never reached the server (or we gave up waiting), so we
 *  cannot know whether it took effect. Callers that trigger a side effect — like
 *  sending a WhatsApp OTP — must treat this as "maybe done", never as "failed". */
export function isTransportError(err: unknown): boolean {
  return err instanceof ApiError && (err.code === 'TIMEOUT' || err.code === 'NETWORK');
}

/** Pull a human-readable message out of an error body.
 *
 *  Handles our own envelope ({message} or {detail:{message}}) AND FastAPI's raw
 *  validation shape, where `detail` is a LIST of {loc,msg,type} objects. That last
 *  case used to fall through to the opaque "Request failed (422)" — which is what
 *  a user saw for something as ordinary as a too-short password. */
function errorMessageFrom(data: any, status: number): string {
  const fallback = `Request failed (${status})`;
  if (!data) return fallback;
  if (typeof data === 'string') return data || fallback;
  if (typeof data.message === 'string' && data.message) return data.message;
  const detail = data.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((entry: any) => (typeof entry === 'string' ? entry : typeof entry?.msg === 'string' ? entry.msg : ''))
      .filter(Boolean);
    if (parts.length) return parts.join('. ');
  }
  if (detail && typeof detail.message === 'string' && detail.message) return detail.message;
  if (typeof data.error === 'string' && data.error) return data.error;
  return fallback;
}

function retryAfterFrom(data: any, res: Response): number | undefined {
  const fromBody = data?.detail?.retryAfterSeconds ?? data?.retryAfterSeconds;
  if (typeof fromBody === 'number' && fromBody > 0) return Math.ceil(fromBody);
  const header = Number(res.headers.get('Retry-After'));
  return Number.isFinite(header) && header > 0 ? Math.ceil(header) : undefined;
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
  if (APP_VERSION) headers['X-App-Version'] = APP_VERSION;

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
    const code = data && (data.errorCode || (data.detail && data.detail.code));
    throw new ApiError(
      errorMessageFrom(data, res.status),
      res.status,
      typeof code === 'string' ? code : undefined,
      data,
      retryAfterFrom(data, res),
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
