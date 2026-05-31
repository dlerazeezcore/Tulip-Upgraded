import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Plus, Signal, Clock, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useEsimStore } from '@/state/esimStore';
import { Flag } from '@/components/Flag';
import { UsageRing } from '@/components/UsageRing';
import { StatusPill } from '@/components/StatusPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EsimInstallCard } from '@/components/EsimInstallCard';
import { checkEsimSupport, isDefinitelyUnsupported, type EsimSupportResult } from '@/services/device';
import { recoverProfile } from '@/services/esim';

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{value}</Text>
      <Text style={{ fontSize: 11, color: t.fgMuted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 12 }}>
      <Text style={{ fontSize: 13, color: t.fgMuted }}>{label}</Text>
      <Text selectable style={{ flex: 1, textAlign: 'right', fontSize: 12, color: t.fg, fontWeight: '600', fontFamily: t.font.bodyMedium }}>
        {value}
      </Text>
    </View>
  );
}

export default function EsimDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const esims = useEsimStore((s) => s.esims);
  const byId = useEsimStore((s) => s.byId);
  const refresh = useEsimStore((s) => s.refresh);
  const refreshUsage = useEsimStore((s) => s.refreshUsage);
  const refreshing = useEsimStore((s) => s.refreshing);
  const topUp = useEsimStore((s) => s.topUp);

  const [support, setSupport] = useState<EsimSupportResult | null>(null);
  const [busy, setBusy] = useState(false);
  // Timestamp of last Activate tap. We use it inside the AppState listener
  // below to decide whether a "foreground" event was a return from the iOS /
  // Android system eSIM install sheet (vs. a casual tab switch). null means
  // "no install pending".
  const pendingActivateAt = useRef<number | null>(null);
  // True while we're syncing immediately after the user returned from system
  // settings — drives a small "Detecting install..." banner so they know what
  // we're doing.
  const [detectingInstall, setDetectingInstall] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/manage/esim');
  };

  useEffect(() => {
    refresh();
    checkEsimSupport().then(setSupport).catch(() => {});
  }, [refresh]);

  // Compute derived values UP FRONT — used by the polling effect below
  // (effects can't reference variables declared further down the function).
  const esim = esims.find((e) => e.id === id) ?? esims[0];
  const profile = esim ? byId(esim.id) : undefined;
  const activationCode =
    profile?.manualEntry?.activationCode ??
    profile?.activationCode ??
    null;
  const hasActivationData = !!activationCode;
  const showInstall = !!esim && esim.status !== 'expired';

  // Auto-poll the provider when this profile has no activation data yet.
  // The provider sometimes takes 30-90s past order_profiles for the eSIM
  // details to materialize; the 86s backend retry covers most cases, but
  // when it doesn't, the user lands on this screen with an empty install
  // card. Instead of asking them to "pull to refresh", we poll silently
  // every 5s for up to 3 min, and they see "Preparing your eSIM…" until
  // the activation code lands.
  const [preparingTick, setPreparingTick] = useState(0); // forces re-render
  useEffect(() => {
    // Only poll when: profile loaded, install would be shown, and we don't
    // have activation data yet.
    if (!esim || !showInstall || hasActivationData) return;
    const profileId = esim.id;
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 36; // ~3 minutes at 5s interval
    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const result = await recoverProfile(profileId);
        if (cancelled) return;
        if (result.hasActivationCode) {
          // Refresh the local store so the install card renders.
          await refresh();
          return; // stop polling
        }
      } catch {
        // ignore — keep polling
      }
      setPreparingTick((n) => n + 1);
      if (!cancelled && attempts < MAX_ATTEMPTS) {
        setTimeout(tick, 5000);
      }
    };
    // Kick off the first attempt immediately so the user doesn't wait 5s.
    tick();
    return () => {
      cancelled = true;
    };
  }, [esim?.id, showInstall, hasActivationData, refresh]);

  // AppState listener for instant install detection. When the user taps
  // Activate, EsimInstallCard calls onActivateTapped which arms pendingActivateAt.
  // The system install sheet takes over; when the user returns to our app,
  // AppState fires 'active'. If that happens within 5 minutes of the tap we
  // call refreshUsage() to pull the latest status from the provider and, if
  // the eSIM is now active, navigate to the home tab.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      if (next !== 'active') return;
      const at = pendingActivateAt.current;
      if (!at || Date.now() - at > 5 * 60 * 1000) return;
      pendingActivateAt.current = null;
      setDetectingInstall(true);
      try {
        await refreshUsage();
      } catch {}
      // Re-read the latest state from the store; the closure captured the
      // pre-refresh `esim` variable.
      const latest = useEsimStore.getState().esims.find((e) => e.id === id);
      setDetectingInstall(false);
      if (latest && latest.status === 'active') {
        // Successful install detected — get them back to the home tab.
        router.replace('/(tabs)');
      }
    });
    return () => sub.remove();
  }, [id, refreshUsage, router]);

  if (!esim) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        {refreshing ? <ActivityIndicator color={t.primary} /> : <Text style={{ color: t.fgMuted }}>eSIM not found.</Text>}
        <PrimaryButton label="Back" onPress={goBack} />
      </SafeAreaView>
    );
  }

  const remainingGb = profile?.remainingDataGb ?? Math.max(0, esim.planGb - esim.usedGb);
  const fraction = esim.planGb > 0 ? remainingGb / esim.planGb : 0;
  const ringColor = esim.status === 'active' ? t.success : esim.status === 'expired' ? t.danger : t.warning;

  const smdp = profile?.manualEntry?.smdpAddress ?? profile?.smdpAddress ?? null;
  const dataLabel = esim.unlimited
    ? `Unlimited · ${esim.planDays} days`
    : `${esim.planGb} GB · ${esim.planDays} days`;

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={goBack}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>eSIM details</Text>
        <Pressable onPress={() => refreshUsage()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={16} color={t.fg} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Flag iso={esim.iso} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 22, color: t.fg, letterSpacing: -0.4 }}>{esim.country}</Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 2 }}>
              {esim.unlimited ? 'Unlimited data' : `${esim.planGb} GB`}{esim.planDays ? ` · ${esim.planDays} days` : ''}
            </Text>
          </View>
          <StatusPill kind={esim.status} />
        </View>

        {/* Device compatibility advisory */}
        {support && (isDefinitelyUnsupported(support) || support.supported === null) && (
          <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' }}>
            <AlertTriangle size={18} color={t.warning} />
            <Text style={{ flex: 1, fontSize: 12, color: t.fg }}>
              {isDefinitelyUnsupported(support)
                ? "This device does not support eSIM. You can still manage this plan, but install it on an eSIM-capable device."
                : 'Make sure your device supports eSIM before installing.'}
            </Text>
          </View>
        )}

        {/* Usage / state */}
        <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', gap: 18, ...t.shadow1 }}>
          {esim.status === 'active' ? (
            <>
              <UsageRing
                fraction={esim.unlimited ? 1 : fraction}
                color={ringColor}
                centerTop={esim.unlimited ? '∞' : `${remainingGb.toFixed(1)} GB`}
                centerSub={esim.unlimited ? 'unlimited' : 'remaining'}
              />
              <View style={{ flexDirection: 'row', width: '100%' }}>
                <Stat label="Used" value={esim.unlimited ? '—' : `${esim.usedGb.toFixed(1)} GB`} />
                <View style={{ width: 1, backgroundColor: t.border }} />
                <Stat label="Days left" value={`${esim.daysLeft}`} />
                <View style={{ width: 1, backgroundColor: t.border }} />
                <Stat label="Plan" value={esim.unlimited ? 'Unlimited' : `${esim.planGb} GB`} />
              </View>
            </>
          ) : esim.status === 'inactive' ? (
            <>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(245,158,11,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <Signal size={32} color={t.warning} strokeWidth={2} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>Ready to install</Text>
                <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4, textAlign: 'center' }}>
                  Install the eSIM below, then activate it when you arrive in {esim.country}.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(220,38,38,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={32} color={t.danger} strokeWidth={2} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>Plan expired</Text>
                <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4, textAlign: 'center' }}>
                  This eSIM reached the end of its window. Top up to keep this number.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Install panel:
            - When we have activation data: full install card (Activate + QR).
            - When we don't: friendly "Preparing your eSIM…" spinner. The
              useEffect above is polling /profiles/{id}/recover every 5s for
              up to 3 minutes; once activation_code lands, this section
              automatically flips to the full install card. */}
        {showInstall && hasActivationData && (
          <EsimInstallCard
            smdp={smdp}
            activationCode={activationCode}
            country={esim.country}
            dataLabel={dataLabel}
            onActivateTapped={() => {
              pendingActivateAt.current = Date.now();
            }}
          />
        )}
        {showInstall && !hasActivationData && (
          <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 18, gap: 12, alignItems: 'center', ...t.shadow1 }}>
            <ActivityIndicator color={t.primary} size="large" />
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg, textAlign: 'center' }}>
              Preparing your eSIM…
            </Text>
            <Text style={{ fontSize: 12, color: t.fgMuted, textAlign: 'center', lineHeight: 18 }}>
              The provider is finalising your install code. This usually takes 10–60 seconds — we'll show the Activate button + QR as soon as it's ready.
            </Text>
          </View>
        )}

        {detectingInstall && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: 'rgba(25,103,210,0.12)', borderWidth: 1, borderColor: 'rgba(25,103,210,0.35)' }}>
            <ActivityIndicator size="small" color={t.primary} />
            <Text style={{ flex: 1, fontSize: 12, color: t.fg }}>
              Detecting install — syncing with the provider…
            </Text>
          </View>
        )}
        {(esim.status === 'active' || esim.status === 'expired') && (
          <PrimaryButton
            label={busy ? 'Working…' : 'Top up'}
            icon={<Plus size={16} color="#fff" strokeWidth={2.4} />}
            onPress={() =>
              run(async () => {
                const res = await topUp(esim.id);
                if (!res.ok) Alert.alert('Top-up unavailable', res.message || 'No top-up plans available.');
              })
            }
          />
        )}

        {/* Technical details */}
        <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }}>
          {esim.iccid ? <Row label="ICCID" value={esim.iccid} /> : null}
          <Row label="Plan" value={`${esim.unlimited ? 'Unlimited' : `${esim.planGb} GB`}`} />
          <Row label="Network" value="Auto-select best partner" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
