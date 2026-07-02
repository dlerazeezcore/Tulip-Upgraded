// Central runtime config. The backend base URL can be overridden per build via
// the EXPO_PUBLIC_API_BASE_URL env var; otherwise it points at the deployed API.
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://backend.tulipbookings.com'
).replace(/\/+$/, '');

// Deep link scheme (matches app.json "scheme"); used for payment redirects.
export const APP_SCHEME = 'tulip';
