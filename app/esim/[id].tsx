// THIN UI — wiring lives in src/screens/esim/useEsimDetail.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Plus, Signal, Clock, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { UsageRing } from '@/components/UsageRing';
import { StatusPill } from '@/components/StatusPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EsimInstallCard } from '@/components/EsimInstallCard';
import { isDefinitelyUnsupported } from '@/services/device';
import { formatRemainingData, formatTimeRemaining, formatUsedData } from '@/lib/esimUsage';
import { useEsimDetail } from '@/screens/esim/useEsimDetail';
import { useIsWideWeb } from '@/lib/responsive';
import { useIsRTL } from '@/lib/rtl';

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
  const isRTL = useIsRTL();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 12 }}>
      <Text style={{ fontSize: 13, color: t.fgMuted }}>{label}</Text>
      <Text selectable style={{ flex: 1, textAlign: isRTL ? 'left' : 'right', fontSize: 12, color: t.fg, fontWeight: '600', fontFamily: t.font.bodyMedium }}>
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
  const isWide = useIsWideWeb();

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

  // Content blocks defined once. On mobile/native they stack in the original
  // order (unchanged). On desktop web (≥1024) they split into two columns —
  // plan/usage/manage on the left, the install card + its banners on the right.
  const headerRow = (
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
  );

  const deviceAdvisory =
    vm.support && (isDefinitelyUnsupported(vm.support) || vm.support.supported === null) ? (
      <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, backgroundColor: t.warningBg, borderWidth: 1, borderColor: `${t.warning}66` }}>
        <AlertTriangle size={18} color={t.warning} />
        <Text style={{ flex: 1, fontSize: 12, color: t.fg }}>
          {isDefinitelyUnsupported(vm.support) ? tr('esim.deviceUnsupported') : tr('esim.deviceCheck')}
        </Text>
      </View>
    ) : null;

  const usageCard = (
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
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.warningBg, alignItems: 'center', justifyContent: 'center' }}>
            <Signal size={32} color={t.warning} strokeWidth={2} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('status.provider_waiting')}</Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4, textAlign: 'center' }}>
              {vm.installed ? tr('esim.providerWaitingInstalled') : tr('esim.providerWaitingNotInstalled')}
            </Text>
          </View>
        </>
      ) : esim.status === 'inactive' ? (
        <>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.warningBg, alignItems: 'center', justifyContent: 'center' }}>
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
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.dangerBg, alignItems: 'center', justifyContent: 'center' }}>
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
  );

  // Install panel:
  //   - With activation data: full install card (Activate + QR + manual entry).
  //   - Without: a "Preparing your eSIM…" spinner while the hook polls recover.
  const installPanel = (
    <>
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
    </>
  );

  const detectingBanner = vm.detectingInstall ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: t.infoBg, borderWidth: 1, borderColor: `${t.info}59` }}>
      <ActivityIndicator size="small" color={t.primary} />
      <Text style={{ flex: 1, fontSize: 12, color: t.fg }}>{tr('esim.detecting')}</Text>
    </View>
  ) : null;

  // Took longer than the ~3 min poll budget — tell the user what to do.
  const timeoutBanner =
    vm.detectTimedOut && !vm.detectingInstall && esim.status !== 'active' ? (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, backgroundColor: t.warningBg, borderWidth: 1, borderColor: `${t.warning}59` }}>
        <AlertTriangle size={18} color={t.warning} />
        <Text style={{ flex: 1, fontSize: 12, color: t.fg, lineHeight: 18 }}>
          {tr('esim.takingLonger', { country: esim.country })}
        </Text>
      </View>
    ) : null;

  // Manual fallback when the AppState listener didn't fire after Settings.
  const recheckButton =
    vm.showInstall && vm.hasActivationData && (esim.status === 'inactive' || esim.status === 'provider_waiting') && !vm.detectingInstall ? (
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
        <Text style={{ color: t.primary, fontWeight: '700', fontSize: 14 }}>{tr('esim.installedCheckNow')}</Text>
      </Pressable>
    ) : null;

  const topUpButton =
    esim.status === 'active' || esim.status === 'expired' ? (
      <PrimaryButton label={tr('esim.topUp')} icon={<Plus size={16} color={t.onPrimary} strokeWidth={2.4} />} onPress={vm.topUp} />
    ) : null;

  const technicalDetails = (
    <View style={{ backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }}>
      {esim.iccid ? <Row label={tr('esim.iccid')} value={esim.iccid} /> : null}
      <Row label={tr('esim.plan')} value={`${esim.unlimited ? tr('esim.unlimited') : `${esim.planGb} GB`}`} />
      <Row label={tr('esim.network')} value={tr('esim.networkValue')} />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.back')}
          hitSlop={4}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>{tr('esim.details')}</Text>
        <Pressable onPress={() => vm.refreshUsage()} accessibilityRole="button" accessibilityLabel={tr('a11y.refresh')} hitSlop={4} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={16} color={t.fg} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 40, gap: 18, maxWidth: isWide ? 1100 : 720, width: '100%', alignSelf: 'center' }}
        refreshControl={
          <RefreshControl
            refreshing={vm.refreshing}
            onRefresh={vm.onRefresh}
            tintColor={t.primary}
            colors={[t.primary]}
          />
        }
      >
        {isWide ? (
          <>
            {headerRow}
            {deviceAdvisory}
            <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 18 }}>
                {usageCard}
                {topUpButton}
                {technicalDetails}
              </View>
              <View style={{ flex: 1, gap: 18 }}>
                {installPanel}
                {detectingBanner}
                {timeoutBanner}
                {recheckButton}
              </View>
            </View>
          </>
        ) : (
          <>
            {headerRow}
            {deviceAdvisory}
            {usageCard}
            {installPanel}
            {detectingBanner}
            {timeoutBanner}
            {recheckButton}
            {topUpButton}
            {technicalDetails}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
