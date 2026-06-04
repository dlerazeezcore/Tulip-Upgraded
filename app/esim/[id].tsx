// THIN UI — wiring lives in src/screens/esim/useEsimDetail.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Plus, Signal, Clock, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { UsageRing } from '@/components/UsageRing';
import { StatusPill } from '@/components/StatusPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EsimInstallCard } from '@/components/EsimInstallCard';
import { isDefinitelyUnsupported } from '@/services/device';
import { formatRemainingData, formatTimeRemaining, formatUsedData } from '@/lib/esimUsage';
import { useEsimDetail } from '@/screens/esim/useEsimDetail';

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
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useEsimDetail();
  const esim = vm.esim;

  if (!esim) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        {vm.refreshing ? <ActivityIndicator color={t.primary} /> : <Text style={{ color: t.fgMuted }}>{tr('esim.notFound')}</Text>}
        <PrimaryButton label={tr('common.back')} onPress={vm.goBack} />
      </SafeAreaView>
    );
  }

  const ringColor = esim.status === 'active' ? t.success : esim.status === 'expired' ? t.danger : t.warning;
  const pillKind = esim.status === 'provider_waiting' ? 'inactive' : esim.status;
  const pillLabel = esim.status === 'provider_waiting' ? tr('status.provider_waiting') : undefined;
  const dataLabel = esim.unlimited
    ? `${tr('esim.unlimited')} · ${esim.planDays} ${tr('esim.days')}`
    : `${esim.planGb} GB · ${esim.planDays} ${tr('esim.days')}`;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>{tr('esim.details')}</Text>
        <Pressable onPress={() => vm.refreshUsage()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={16} color={t.fg} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        refreshControl={
          <RefreshControl
            refreshing={vm.refreshing}
            onRefresh={vm.onRefresh}
            tintColor={t.primary}
            colors={[t.primary]}
          />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Flag iso={esim.iso} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 22, color: t.fg, letterSpacing: -0.4 }}>{esim.country}</Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 2 }}>
              {esim.unlimited ? tr('esim.unlimitedData') : `${esim.planGb} GB`}{esim.planDays ? ` · ${esim.planDays} ${tr('esim.days')}` : ''}
            </Text>
          </View>
          <StatusPill kind={pillKind} label={pillLabel} />
        </View>

        {/* Device compatibility advisory */}
        {vm.support && (isDefinitelyUnsupported(vm.support) || vm.support.supported === null) && (
          <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' }}>
            <AlertTriangle size={18} color={t.warning} />
            <Text style={{ flex: 1, fontSize: 12, color: t.fg }}>
              {isDefinitelyUnsupported(vm.support)
                ? tr('esim.deviceUnsupported')
                : tr('esim.deviceCheck')}
            </Text>
          </View>
        )}

        {/* Usage / state */}
        <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', gap: 18, ...t.shadow1 }}>
          {esim.status === 'active' ? (
            <>
              <UsageRing
                fraction={esim.unlimited ? 1 : vm.fraction}
                color={ringColor}
                centerTop={esim.unlimited ? '∞' : formatRemainingData(esim.remainingMb).replace(' left', '')}
                centerSub={esim.unlimited ? tr('esim.unlimitedShort') : tr('esim.remaining')}
              />
              <View style={{ flexDirection: 'row', width: '100%' }}>
                <Stat label={tr('esim.statUsed')} value={esim.unlimited ? '—' : formatUsedData(esim.usedMb)} />
                <View style={{ width: 1, backgroundColor: t.border }} />
                <Stat label={tr('esim.statTimeLeft')} value={formatTimeRemaining(esim.hoursLeft).replace(' left', '')} />
                <View style={{ width: 1, backgroundColor: t.border }} />
                <Stat label={tr('esim.statPlan')} value={esim.unlimited ? tr('esim.unlimited') : `${esim.planGb} GB`} />
              </View>
            </>
          ) : esim.status === 'provider_waiting' ? (
            <>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(245,158,11,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <Signal size={32} color={t.warning} strokeWidth={2} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('status.provider_waiting')}</Text>
                <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4, textAlign: 'center' }}>
                  {vm.installed
                    ? tr('esim.providerWaitingInstalled')
                    : tr('esim.providerWaitingNotInstalled')}
                </Text>
              </View>
            </>
          ) : esim.status === 'inactive' ? (
            <>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(245,158,11,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <Signal size={32} color={t.warning} strokeWidth={2} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('esim.readyToInstall')}</Text>
                <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4, textAlign: 'center' }}>
                  {tr('esim.readyToInstallSub', { country: esim.country })}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(220,38,38,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={32} color={t.danger} strokeWidth={2} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('esim.planExpired')}</Text>
                <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4, textAlign: 'center' }}>
                  {tr('esim.planExpiredSub')}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Install panel:
            - When we have activation data: full install card (Activate + QR).
            - When we don't: friendly "Preparing your eSIM…" spinner. The hook
              polls /profiles/{id}/recover every 5s for up to 3 minutes; once
              activation_code lands, this section flips to the full card. */}
        {vm.showInstall && vm.hasActivationData && (
          <EsimInstallCard
            smdp={vm.smdp}
            activationCode={vm.activationCode}
            country={esim.country}
            dataLabel={dataLabel}
            onActivateTapped={vm.onActivateTapped}
          />
        )}
        {vm.showInstall && !vm.hasActivationData && (
          <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 18, gap: 12, alignItems: 'center', ...t.shadow1 }}>
            <ActivityIndicator color={t.primary} size="large" />
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg, textAlign: 'center' }}>
              {tr('esim.preparing')}
            </Text>
            <Text style={{ fontSize: 12, color: t.fgMuted, textAlign: 'center', lineHeight: 18 }}>
              {tr('esim.preparingSub')}
            </Text>
          </View>
        )}

        {vm.detectingInstall && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: 'rgba(25,103,210,0.12)', borderWidth: 1, borderColor: 'rgba(25,103,210,0.35)' }}>
            <ActivityIndicator size="small" color={t.primary} />
            <Text style={{ flex: 1, fontSize: 12, color: t.fg }}>
              {tr('esim.detecting')}
            </Text>
          </View>
        )}

        {/* Took longer than the ~3 min poll budget — tell the user what to do
            instead of leaving them on a silent screen. */}
        {vm.detectTimedOut && !vm.detectingInstall && esim.status !== 'active' && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)' }}>
            <AlertTriangle size={18} color={t.warning} />
            <Text style={{ flex: 1, fontSize: 12, color: t.fg, lineHeight: 18 }}>
              {tr('esim.takingLonger', { country: esim.country })}
            </Text>
          </View>
        )}

        {/* Manual fallback: if the AppState listener didn't kick in (some
            iOS versions don't reliably fire 'active' after Settings), the
            user can tap this to start the same polling loop. */}
        {vm.showInstall && vm.hasActivationData && (esim.status === 'inactive' || esim.status === 'provider_waiting') && !vm.detectingInstall && (
          <Pressable
            onPress={vm.recheckInstall}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: t.primary,
              backgroundColor: 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <RefreshCw size={16} color={t.primary} strokeWidth={2.2} />
            <Text style={{ color: t.primary, fontWeight: '700', fontSize: 14 }}>
              {tr('esim.installedCheckNow')}
            </Text>
          </Pressable>
        )}
        {(esim.status === 'active' || esim.status === 'expired') && (
          <PrimaryButton
            label={vm.busy ? tr('esim.working') : tr('esim.topUp')}
            icon={<Plus size={16} color="#fff" strokeWidth={2.4} />}
            onPress={vm.topUp}
          />
        )}

        {/* Technical details */}
        <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }}>
          {esim.iccid ? <Row label={tr('esim.iccid')} value={esim.iccid} /> : null}
          <Row label={tr('esim.plan')} value={`${esim.unlimited ? tr('esim.unlimited') : `${esim.planGb} GB`}`} />
          <Row label={tr('esim.network')} value={tr('esim.networkValue')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
