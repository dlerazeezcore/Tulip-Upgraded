// Presentational "enter the code we sent you" step, shared by sign-in, sign-up and
// forgot-password so the three flows cannot drift apart. Pure props in, no state of
// its own — the calling screen's hook owns everything via useOtpChallenge.
//
// There is no submit button in the normal path: the code verifies itself as soon as
// the last digit is typed. A button only reappears when a verification failed for a
// reason that leaves the typed digits worth keeping (no connection, timeout, rate
// limit) — a wrong code clears the boxes instead, and the next code the user types
// submits itself.
import React from 'react';
import { ActivityIndicator, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { OtpInput } from '@/components/OtpInput';
import { PrimaryButton } from '@/components/PrimaryButton';

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function OtpCodeStep({
  phone,
  code,
  onChangeCode,
  focusSignal,
  maybeSent,
  resendIn,
  expiresIn,
  canResend,
  canRetry,
  busy,
  error,
  busyLabel,
  onRetry,
  onBack,
  backLabel,
  onResend,
}: {
  phone: string;
  code: string;
  onChangeCode: (v: string) => void;
  /** Increment to pull focus back into the boxes (after a rejected code). */
  focusSignal: number;
  /** The send was never confirmed — tell the user to check WhatsApp anyway. */
  maybeSent: boolean;
  resendIn: number;
  expiresIn: number;
  canResend: boolean;
  /** A verification failed without invalidating the code — offer to resend it. */
  canRetry: boolean;
  busy: boolean;
  error: string | null;
  busyLabel: string;
  onRetry: () => void;
  onBack: () => void;
  backLabel: string;
  onResend: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();

  return (
    <>
      <Text style={{ fontSize: 13, color: t.fg }}>{tr('auth.enterCodeSentTo', { phone })}</Text>

      {maybeSent && (
        <View
          style={{
            padding: 12,
            borderRadius: t.radius.md,
            backgroundColor: t.warningBg,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          <Text style={{ fontSize: 12, color: t.warningFg }}>{tr('auth.sendUnconfirmed')}</Text>
        </View>
      )}

      <OtpInput value={code} onChange={onChangeCode} focusSignal={focusSignal} editable={!busy} />

      {busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ActivityIndicator size="small" color={t.primary} />
          <Text style={{ fontSize: 12, color: t.fgMuted }}>{busyLabel}</Text>
        </View>
      ) : (
        expiresIn > 0 && (
          <Text style={{ fontSize: 12, color: t.fgMuted }}>
            {tr('auth.codeExpiresIn', { time: formatClock(expiresIn) })}
          </Text>
        )
      )}

      {error && <Text style={{ fontSize: 12, color: t.danger }}>{error}</Text>}

      {/* Only after a failure that did NOT invalidate what they typed. */}
      {canRetry && !busy && (
        <PrimaryButton label={tr('common.tryAgain')} onPress={onRetry} />
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" disabled={busy}>
          <Text style={{ fontSize: 12, color: busy ? t.fgFaint : t.fgMuted }}>{backLabel}</Text>
        </Pressable>
        <Pressable
          onPress={onResend}
          hitSlop={8}
          accessibilityRole="button"
          disabled={!canResend}
          accessibilityState={{ disabled: !canResend }}
        >
          <Text style={{ fontSize: 12, color: canResend ? t.primary : t.fgFaint, fontWeight: '700' }}>
            {resendIn > 0 ? tr('auth.resendIn', { time: formatClock(resendIn) }) : tr('auth.resendCode')}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
