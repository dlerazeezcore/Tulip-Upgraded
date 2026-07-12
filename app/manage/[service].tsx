// THIN UI — wiring lives in src/screens/manage/useManageService.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Archive, Smartphone, Sparkles, type LucideIcon } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { StackHeader } from '@/components/StackHeader';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { StatusPill } from '@/components/StatusPill';
import { PressableScale } from '@/components/PressableScale';
import { EsimListSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';
import { useManageService } from '@/screens/manage/useManageService';

function Card({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const t = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      style={{
        backgroundColor: t.bgElev,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: t.radius.card,
        padding: 14,
        ...t.shadow1,
      }}
    >
      {children}
    </PressableScale>
  );
}

function HistoryCard({ count, onPress }: { count: number; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  if (count === 0) return null;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      style={{
        backgroundColor: t.bgElev,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: t.radius.card,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        ...t.shadow1,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
        <Archive size={20} color={t.fgMuted} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
          {tr('manage.history')}
        </Text>
        <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
          {tr('manage.historyDesc', { count, unit: count === 1 ? tr('manage.bundle') : tr('manage.bundles') })}
        </Text>
      </View>
      <DirectionalChevron direction="forward" size={18} color={t.fgFaint} />
    </PressableScale>
  );
}

function EsimList({ vm }: { vm: ReturnType<typeof useManageService> }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const esims = vm.esims;
  const refreshing = vm.refreshing;
  const loaded = vm.loaded;

  if (!loaded) {
    if (vm.errored) return <ErrorState onRetry={vm.retry} />;
    return <EsimListSkeleton count={3} />;
  }

  if (loaded && esims.length === 0) {
    return (
      <View style={{ gap: 10 }}>
        <EmptyState
          icon={Smartphone}
          title={tr('manage.noEsimsTitle')}
          subtitle={tr('manage.noEsimsSub')}
        />
        <HistoryCard count={vm.historyCount} onPress={vm.goHistory} />
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {esims.map((e) => (
        <Card key={e.id} onPress={() => vm.goEsim(e.id)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Flag iso={e.iso} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>
                {e.country}
              </Text>
              <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                {e.planLine}
              </Text>
            </View>
            <StatusPill kind={e.pillKind} label={e.pillLabel} />
          </View>

          {e.hasUsageRow && (
            <View style={{ marginTop: 12 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: t.bgSunken, overflow: 'hidden' }}>
                <View style={{ width: `${e.barPct}%`, height: 6, borderRadius: 3, backgroundColor: e.barColor }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: t.fg, fontWeight: '600' }}>
                  {e.remainingLabel}
                </Text>
                <Text style={{ fontSize: 11, color: t.fgMuted }}>
                  {e.timeLabel}
                </Text>
              </View>
            </View>
          )}

          {e.showTapToInstall && (
            // Don't render a separate Activate button here — tapping the
            // whole card takes the user to the detail page, where the full
            // install flow lives (Activate + QR + Share). A duplicate
            // button on the list calls the wrong backend action and
            // confuses users about "did I install or not?".
            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 11, color: t.fgMuted }}>
                {tr('manage.tapToInstall')}
              </Text>
            </View>
          )}
        </Card>
      ))}
      <HistoryCard count={vm.historyCount} onPress={vm.goHistory} />
    </View>
  );
}

function ComingSoon({ label, Icon }: { label: string; Icon?: LucideIcon }) {
  const { t: tr } = useTranslation();
  // FE-21: use the branded EmptyState (like every other empty surface) rather
  // than a bare centered Text block.
  return (
    <EmptyState
      icon={Icon ?? Sparkles}
      title={tr('manage.comingSoonTitle')}
      subtitle={tr('manage.comingSoonBody', { label })}
    />
  );
}

export default function ManageService() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useManageService();
  const { svc, service, title } = vm;

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: t.bg }}>
      <StackHeader
        title={title}
        onBack={vm.goBack}
        leading={svc ? <svc.Icon size={20} color={svc.color} strokeWidth={2} /> : undefined}
        right={
          svc && service === 'esim' ? (
            <Pressable
              onPress={vm.goBookNew}
              accessibilityRole="button"
              hitSlop={8}
              style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: t.radius.pill, backgroundColor: svc.color }}
            >
              <Text style={{ color: t.onPrimary, fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>
                {tr('manage.bookNew')}
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10, maxWidth: 900, width: '100%', alignSelf: 'center' }}
        refreshControl={
          service === 'esim' ? (
            <RefreshControl refreshing={vm.refreshing} onRefresh={vm.onPullToRefresh} tintColor={t.primary} colors={[t.primary]} />
          ) : undefined
        }
      >
        {service === 'esim' ? <EsimList vm={vm} /> : <ComingSoon label={svc ? tr(`serviceNames.${svc.id}`) : String(service ?? '')} Icon={svc?.Icon} />}
      </ScrollView>
    </ScreenSafeArea>
  );
}
