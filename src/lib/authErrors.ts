// Turn a thrown auth/OTP error into a LOCALIZED, actionable message.
//
// Backend `detail` strings are English-only, and the auth screens used to render
// them verbatim — so an Arabic or Kurdish user got raw English at the exact moment
// something went wrong. We key off the stable machine codes the API now sends
// (rate_limit.py and auth.py attach a `code` to every detail) plus the HTTP status,
// and only fall back to the server's own text when we have nothing better.
import { ApiError } from '@/lib/api';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function authErrorMessage(err: unknown, tr: Translate): string {
  if (!(err instanceof ApiError)) {
    return tr('common.somethingWrong');
  }

  switch (err.code) {
    case 'NETWORK':
      return tr('auth.errors.network');
    case 'TIMEOUT':
      return tr('auth.errors.timeout');
    case 'OTP_CHALLENGE_MISSING':
      return tr('auth.errors.challengeMissing');
    case 'OTP_RESEND_COOLDOWN':
      return tr('auth.errors.resendCooldown', { seconds: err.retryAfterSeconds ?? 60 });
    case 'OTP_SEND_LIMIT':
    case 'OTP_VERIFY_LIMIT':
    case 'LOGIN_RATE_LIMIT':
    case 'RATE_LIMITED':
      return tr('auth.errors.rateLimited');
    case 'AUTH_OTP_INVALID':
      return tr('auth.errors.otpInvalid');
    case 'AUTH_OTP_REQUIRED':
      return tr('auth.errors.otpRequired');
    case 'AUTH_NO_ACCOUNT':
      return tr('auth.errors.noAccount');
    case 'AUTH_ACCOUNT_INACTIVE':
      return tr('auth.errors.accountInactive');
    default:
      break;
  }

  switch (err.status) {
    case 0:
      return tr('auth.errors.network');
    case 401:
      return tr('auth.errors.invalidCredentials');
    case 404:
      return tr('auth.errors.noAccount');
    case 409:
      return tr('auth.errors.alreadyExists');
    case 429:
      return tr('auth.errors.rateLimited');
    case 502:
    case 503:
      return tr('auth.errors.otpUndeliverable');
    default:
      break;
  }

  // 400/422 and anything else: the server message is the most specific thing we
  // have (e.g. a phone-format complaint), so prefer it over a vague fallback.
  return err.message || tr('common.somethingWrong');
}
