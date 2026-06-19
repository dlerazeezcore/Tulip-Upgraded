import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEsimStore } from '@/state/esimStore';
import { checkEsimSupport, type EsimSupportResult } from '@/services/device';
import { recoverProfile } from '@/services/esim';

export function useEsimDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const esims = useEsimStore((s) => s.esims);
  const byId = useEsimStore((s) => s.byId);
  const refresh = useEsimStore((s) => s.refresh);
  const refreshUsage = useEsimStore((s) => s.refreshUsage);
  const refreshing = useEsimStore((s) => s.refreshing);
  const install = useEsimStore((s) => s.install);

  const [support, setSupport] = useState<EsimSupportResult | null>(null);
  // Timestamp of last Activate tap. We use it inside the AppState listener
  // below to decide whether a "foreground" event was a return from the iOS /
  // Android system eSIM install sheet (vs. a casual tab switch). null means
  // "no install pending".
  const pendingActivateAt = useRef<number | null>(null);
  // True while we're syncing immediately after the user returned from system
  // settings — drives a small "Detecting install..." banner so they know what
  // we're doing.
  const [detectingInstall, setDetectingInstall] = useState(false);
  // Set true when the detect-install poll runs its full ~3 min budget without
  // the provider confirming service. Drives an inline "taking longer than
  // usual" message instead of the old silent stop (no dead-end).
  const [detectTimedOut, setDetectTimedOut] = useState(false);
  // Lets the "I've installed it" button trigger the SAME polling loop the
  // AppState listener uses. Wired inside the AppState useEffect.
  const pollStarterRef = useRef<(() => void) | null>(null);

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
  // AppState fires 'active'.
  //
  // The provider often doesn't show IN_USE the very second the user installs
  // — it can take 30-90s as the cellular session starts and the carrier
  // notifies the provider. So we don't just check once; we poll the
  // per-profile recover endpoint every 4s for up to 3 minutes. The moment
  // the status flips to ACTIVE we navigate to the home tab.
  useEffect(() => {
    let pollCancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const stopPolling = () => {
      pollCancelled = true;
      if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
      setDetectingInstall(false);
    };

    const startPolling = () => {
      pollCancelled = false;
      setDetectingInstall(true);
      setDetectTimedOut(false);
      let attempts = 0;
      let installRecorded = false;
      const MAX_ATTEMPTS = 45; // 45 * 4s = 3 minutes
      const tick = async () => {
        if (pollCancelled) return;
        attempts += 1;
        if (!installRecorded) {
          installRecorded = true;
          try { await useEsimStore.getState().install(id); } catch {}
        }
        // recoverProfile syncs THIS one profile from provider (faster than
        // refreshUsage which tries to sync everything). The backend only
        // returns ACTIVE after install is recorded and the provider confirms
        // usable service, so provider catch-up stays in provider_waiting.
        let recovered: Awaited<ReturnType<typeof recoverProfile>> | null = null;
        try {
          recovered = await recoverProfile(id);
        } catch {}
        if (pollCancelled) return;
        if (
          recovered &&
          recovered.installed === true &&
          (recovered.appStatus || '').toUpperCase() === 'PROVIDER_WAITING'
        ) {
          try { await refresh(); } catch {}
          stopPolling();
          return;
        }
        if (
          recovered &&
          (recovered.appStatus || '').toUpperCase() === 'ACTIVE' &&
          recovered.installed === true &&
          !!recovered.activatedAt
        ) {
          // Pull fresh store state so the home tab paints with real usage/days.
          try { await refreshUsage(); } catch {}
          stopPolling();
          router.replace('/(tabs)');
          return;
        }
        // Occasional fallback path: usage can be the first provider signal
        // that service is active, but doing this every 4s can pin the backend.
        if (attempts % 5 === 0) {
          try { await refreshUsage(); } catch {}
          const latest = useEsimStore.getState().esims.find((e) => e.id === id);
          if (latest && latest.status === 'active') {
            stopPolling();
            router.replace('/(tabs)');
            return;
          }
          if (latest && latest.status === 'provider_waiting') {
            stopPolling();
            return;
          }
        }
        if (attempts < MAX_ATTEMPTS) {
          pollTimer = setTimeout(tick, 4000);
        } else {
          // 3 min and still not active — likely the user hasn't finished the
          // install yet, or the provider/carrier is slow to report the first
          // connection. Surface a clear "taking longer" message + keep the
          // manual recheck button prominent (no silent dead-end).
          setDetectTimedOut(true);
          stopPolling();
        }
      };
      tick();
    };

    // Expose startPolling so the manual "I've installed it" button can fire it.
    pollStarterRef.current = startPolling;

    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      const at = pendingActivateAt.current;
      if (!at || Date.now() - at > 10 * 60 * 1000) return;
      // Reset the arm so a second app-foreground (e.g. they switch tabs)
      // doesn't kick off another polling loop.
      pendingActivateAt.current = null;
      startPolling();
    });
    return () => {
      sub.remove();
      stopPolling();
      pollStarterRef.current = null;
    };
  }, [id, install, refresh, refreshUsage, router]);

  // Use raw MB for the fraction so the ring reflects byte-level usage.
  const planMb = esim ? esim.planGb * 1024 : 0;
  const fraction = esim && planMb > 0 ? esim.remainingMb / planMb : 0;
  const smdp = profile?.manualEntry?.smdpAddress ?? profile?.smdpAddress ?? null;

  const onRefresh = async () => {
    // Pull-to-refresh: also force a per-profile provider recover so status,
    // GB usage, and days remaining catch up to whatever the provider knows.
    try { await recoverProfile(id); } catch {}
    await refreshUsage();
  };

  // Open the top-up screen (choose a plan → pay via the loyalty/FIB window).
  // This replaces the old one-tap instant charge for the cheapest plan.
  const goTopUp = () => {
    if (!esim) return;
    router.push(`/esim/top-up?id=${esim.id}`);
  };

  return {
    esim,
    installed: !!profile?.installed,
    support,
    refreshing,
    detectingInstall,
    detectTimedOut,
    showInstall,
    hasActivationData,
    activationCode,
    smdp,
    fraction,
    goBack,
    refreshUsage,
    onRefresh,
    onActivateTapped: () => {
      pendingActivateAt.current = Date.now();
    },
    recheckInstall: () => pollStarterRef.current?.(),
    topUp: goTopUp,
  };
}
