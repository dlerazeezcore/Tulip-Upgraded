// THIN UI — wiring lives in src/screens/manage/useManageService.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Archive, Smartphone } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { StatusPill } from '@/components/StatusPill';
import { PressableScale } from '@/components/PressableScale';
import { EsimListSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
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
        borderRadius: 16,
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
        borderRadius: 16,
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

  if (!loaded && refreshing) {
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

function ComingSoon({ label }: { label: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center', gap: 8 }}>
      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('manage.comingSoonTitle')}</Text>
      <Text style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center', maxWidth: 320 }}>
        {tr('manage.comingSoonBody', { label })}
      </Text>
    </View>
  );
}

export default function ManageService() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const vm = useManageService();
  const { svc, service, title } = vm;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tr('a11y.back')}
          hitSlop={4} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {svc && <svc.Icon size={20} color={svc.color} strokeWidth={2} />}
          <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
            {title}
          </Text>
        </View>
        {svc && service === 'esim' && (
          <Pressable
            onPress={vm.goBookNew}
            style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: svc.color }}
          >
            <Text style={{ color: t.onPrimary, fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>
              {tr('manage.bookNew')}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10, maxWidth: 900, width: '100%', alignSelf: 'center' }}
        refreshControl={
          service === 'esim' ? (
            <RefreshControl refreshing={vm.refreshing} onRefresh={vm.onPullToRefresh} tintColor={t.primary} colors={[t.primary]} />
          ) : undefined
        }
      >
        {service === 'esim' ? <EsimList vm={vm} /> : <ComingSoon label={svc ? tr(`serviceNames.${svc.id}`) : String(service ?? '')} />}
      </ScrollView>
    </SafeAreaView>
  );
}
