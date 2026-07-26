// Shared wiring for the WhatsApp-OTP sub-flow used by sign-in, sign-up and
// forgot-password. Each screen owns its own steps and its own "what happens after
// verification"; everything below is the part all three need and previously
// re-implemented (inconsistently, and in ways that could get stuck).
//
// Owns: the signed challenge from /otp/send, the typed code, the resend-cooldown
// countdown, the code-expiry countdown, and recovery when a send response is lost.
//
// WHY THE CACHE: the challenge is the ONLY thing that can redeem a delivered code,
// and the server keeps no copy — the OTP flow is deliberately stateless. So if this
// screen unmounts mid-flow (iOS presents /auth/* as a swipe-dismissable modal, and
// backgrounding can tear down the JS context) the challenge would be gone while the
// code sits in the user's WhatsApp. We cache it per-phone until it expires.
//
// WHY `maybeSent`: a timeout or dropped connection does NOT mean the code was not
// sent — the backend fires the provider call immediately and does not check whether
// the caller is still listening. Treating that as a hard failure is what left users
// staring at the phone field while the code arrived. We advance anyway and say so.
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, isTransportError } from '@/lib/api';
import { OTP_CODE_LENGTH, sendOtp, verifyOtp } from '@/services/auth';

const CACHE_KEY = 'tulip.auth.otpChallenge';

type CachedChallenge = {
  phone: string;
  challenge: string;
  /** Epoch ms after which the challenge is worthless. */
  expiresAt: number;
  /** Epoch ms before which a resend would be rejected by the server cooldown. */
  resendAt: number;
};

async function readCache(phone: string): Promise<CachedChallenge | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedChallenge;
    if (parsed?.phone !== phone || !parsed?.challenge) return null;
    if (!parsed.expiresAt || parsed.expiresAt <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry: CachedChallenge): void {
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry)).catch(() => {});
}

function clearCache(): void {
  AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
}

/** Seconds remaining until `at`, floored at 0. */
function secondsUntil(at: number | null): number {
  if (!at) return 0;
  return Math.max(0, Math.ceil((at - Date.now()) / 1000));
}

export type OtpChallengeViewModel = {
  code: string;
  setCode: (v: string) => void;
  /** True once a code has been requested and we have somewhere to type it. */
  hasChallenge: boolean;
  /** Seconds until Resend is allowed; 0 means allowed now. */
  resendIn: number;
  /** Seconds until the delivered code stops working; 0 means unknown/expired. */
  expiresIn: number;
  /** The send may or may not have gone out — tell the user to check WhatsApp. */
  maybeSent: boolean;
  /** Enough digits typed to bother calling verify. */
  codeComplete: boolean;
  clearMaybeSent: () => void;
};

export function useOtpChallenge() {
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [maybeSent, setMaybeSent] = useState(false);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  // Re-rendered once per second only while a countdown is actually running.
  const [, forceTick] = useState(0);
  const challengeRef = useRef<string | null>(null);

  const setChallengeBoth = useCallback((value: string | null) => {
    challengeRef.current = value;
    setChallenge(value);
  }, []);

  const resendIn = secondsUntil(resendAt);
  const expiresIn = secondsUntil(expiresAt);
  const ticking = resendIn > 0 || expiresIn > 0;

  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [ticking]);

  /** Adopt a cached challenge for `phone`, if one survived a remount. */
  const restore = useCallback(
    async (phone: string): Promise<boolean> => {
      const cached = await readCache(phone);
      if (!cached) return false;
      setChallengeBoth(cached.challenge);
      setExpiresAt(cached.expiresAt);
      setResendAt(cached.resendAt);
      return true;
    },
    [setChallengeBoth],
  );

  /**
   * Request a code. Returns true when the caller should advance to the code step.
   *
   * Returns true even on a timeout/network failure, flagging `maybeSent`: the
   * message has very likely gone out, so stranding the user on the phone field is
   * the worst possible outcome. Any real server rejection (429, 502, validation)
   * throws so the screen can surface it.
   */
  const send = useCallback(
    async (phone: string): Promise<boolean> => {
      try {
        const res = await sendOtp(phone);
        const now = Date.now();
        const expires = now + Math.max(0, res.expiresInSeconds || 0) * 1000;
        const resend = now + Math.max(0, res.resendInSeconds || 0) * 1000;
        setChallengeBoth(res.challenge);
        setExpiresAt(expires);
        setResendAt(resend);
        setMaybeSent(false);
        setCode('');
        writeCache({ phone, challenge: res.challenge, expiresAt: expires, resendAt: resend });
        return true;
      } catch (err) {
        if (isTransportError(err)) {
          // We never saw the response, so we have no challenge — but the code may
          // well have been delivered. Try to fall back to a cached challenge for
          // this phone; either way advance so Resend and the code field are usable.
          const recovered = await restore(phone);
          setMaybeSent(true);
          if (!recovered) setChallengeBoth(null);
          return true;
        }
        // A cooldown rejection still means a code is out there from the previous
        // send — keep the countdown so Resend shows time remaining, not an error.
        if (err instanceof ApiError && err.status === 429 && err.retryAfterSeconds) {
          setResendAt(Date.now() + err.retryAfterSeconds * 1000);
        }
        throw err;
      }
    },
    [restore, setChallengeBoth],
  );

  /** Exchange the typed code for a verification token. */
  const verify = useCallback(async (phone: string): Promise<string> => {
    const active = challengeRef.current;
    if (!active) {
      // No challenge (its response was lost). The code cannot be checked without
      // it, so ask for a fresh one rather than failing opaquely.
      const cached = await readCache(phone);
      if (!cached) throw new ApiError('OTP_CHALLENGE_MISSING', 0, 'OTP_CHALLENGE_MISSING');
      challengeRef.current = cached.challenge;
    }
    const res = await verifyOtp({ phone, code, challenge: challengeRef.current as string });
    clearCache();
    return res.verificationToken;
  }, [code]);

  const reset = useCallback(() => {
    setCode('');
    setChallengeBoth(null);
    setMaybeSent(false);
    setResendAt(null);
    setExpiresAt(null);
    clearCache();
  }, [setChallengeBoth]);

  return {
    // state
    code,
    setCode,
    challenge,
    hasChallenge: challenge !== null,
    maybeSent,
    resendIn,
    expiresIn,
    codeComplete: code.length >= OTP_CODE_LENGTH,
    // actions
    send,
    verify,
    reset,
    restore,
    clearMaybeSent: () => setMaybeSent(false),
  };
}
