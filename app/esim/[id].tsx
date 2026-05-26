import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Smartphone, Plus, Signal, Clock, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useEsimStore } from '@/state/esimStore';
import { Flag } from '@/components/Flag';
import { UsageRing } from '@/components/UsageRing';
import { StatusPill } from '@/components/StatusPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { checkEsimSupport, isDefinitelyUnsupported, type EsimSupportResult } from '@/services/device';

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
  const activate = useEsimStore((s) => s.activate);
  const topUp = useEsimStore((s) => s.topUp);

  const [support, setSupport] = useState<EsimSupportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/manage/esim');
  };

  useEffect(() => {
    refresh();
    checkEsimSupport().then(setSupport).catch(() => {});
  }, [refresh]);

  const esim = esims.find((e) => e.id === id) ?? esims[0];
  const profile = esim ? byId(esim.id) : undefined;

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

  const qrUrl = profile?.qrCodeUrl ?? null;
  const appleUrl = profile?.appleInstallUrl ?? null;
  const smdp = profile?.manualEntry?.smdpAddress ?? profile?.smdpAddress ?? null;
  const activationCode = profile?.manualEntry?.activationCode ?? profile?.activationCode ?? null;
  const showInstall = esim.status !== 'expired' && (qrUrl || activationCode);

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
              {esim.unlimited ? 'Unlimited data' : `${esim.planGb} GB`}{esim.daysLeft ? ` · ${esim.daysLeft} days left` : ''}
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

        {/* Install section: QR + iPhone one-tap + manual entry */}
        {showInstall && (
          <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 18, gap: 14, ...t.shadow1 }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>Install eSIM</Text>
            {qrUrl && (
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 16 }}>
                  <Image source={qrUrl} style={{ width: 180, height: 180 }} contentFit="contain" transition={200} />
                </View>
                <Text style={{ fontSize: 12, color: t.fgMuted }}>Scan with another device's camera</Text>
              </View>
            )}
            {appleUrl && (
              <PrimaryButton
                label="Install on this iPhone"
                icon={<Smartphone size={16} color="#fff" strokeWidth={2.2} />}
                onPress={() =>
                  Linking.openURL(appleUrl).catch(() =>
                    Alert.alert('Could not open eSIM setup', 'Use the QR code or manual details instead.'),
                  )
                }
              />
            )}
            {(smdp || activationCode) && (
              <View style={{ borderWidth: 1, borderColor: t.border, borderRadius: 12, overflow: 'hidden' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, padding: 12, paddingBottom: 0 }}>
                  Manual entry
                </Text>
                {smdp && <Row label="SM-DP+ address" value={smdp} />}
                {activationCode && <Row label="Activation code" value={activationCode} />}
              </View>
            )}
          </View>
        )}

        {/* Primary action by state */}
        {esim.status === 'inactive' && (
          <PrimaryButton
            label={busy ? 'Activating…' : 'Activate eSIM'}
            icon={<Signal size={16} color="#fff" strokeWidth={2.2} />}
            onPress={() => run(() => activate(esim.id))}
          />
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
