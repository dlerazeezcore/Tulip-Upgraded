import React from 'react';
import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, QrCode, Plus, Signal, Clock, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useEsimStore } from '@/state/esimStore';
import { Flag } from '@/components/Flag';
import { UsageRing } from '@/components/UsageRing';
import { StatusPill } from '@/components/StatusPill';
import { PrimaryButton } from '@/components/PrimaryButton';

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: t.fgMuted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function EsimDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const esims = useEsimStore((s) => s.esims);
  const activate = useEsimStore((s) => s.activate);
  const topUp = useEsimStore((s) => s.topUp);
  const esim = esims.find((e) => e.id === id) ?? esims[0];

  const remainingGb = Math.max(0, esim.planGb - esim.usedGb);
  const fraction = esim.planGb > 0 ? remainingGb / esim.planGb : 0;
  const ringColor =
    esim.status === 'active' ? t.success : esim.status === 'expired' ? t.danger : t.warning;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 18, fontWeight: '700', color: t.fg }}>
          eSIM details
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Identity */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Flag iso={esim.iso} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 22, color: t.fg, letterSpacing: -0.4 }}>
              {esim.country}
            </Text>
            <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 2 }}>
              {esim.planGb} GB · {esim.planDays} days
            </Text>
          </View>
          <StatusPill kind={esim.status} />
        </View>

        {/* Usage ring */}
        <View
          style={{
            backgroundColor: t.bgElev,
            borderColor: t.border,
            borderWidth: 1,
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            gap: 18,
            ...t.shadow1,
          }}
        >
          {esim.status === 'active' ? (
            <>
              <UsageRing
                fraction={fraction}
                color={ringColor}
                centerTop={`${remainingGb.toFixed(1)} GB`}
                centerSub="remaining"
              />
              <View style={{ flexDirection: 'row', width: '100%' }}>
                <Stat label="Used" value={`${esim.usedGb.toFixed(1)} GB`} />
                <View style={{ width: 1, backgroundColor: t.border }} />
                <Stat label="Days left" value={`${esim.daysLeft}`} />
                <View style={{ width: 1, backgroundColor: t.border }} />
                <Stat label="Plan" value={`${esim.planGb} GB`} />
              </View>
            </>
          ) : esim.status === 'inactive' ? (
            <>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: 'rgba(245,158,11,0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Signal size={32} color={t.warning} strokeWidth={2} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                  Ready to activate
                </Text>
                <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4, textAlign: 'center' }}>
                  Activate when you arrive in {esim.country}. Your {esim.planDays}-day window
                  starts on activation.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: 'rgba(220,38,38,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={32} color={t.danger} strokeWidth={2} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                  Plan expired
                </Text>
                <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4, textAlign: 'center' }}>
                  This eSIM has used all its data or reached the end of its window. Top up to keep
                  this number.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Primary action by state */}
        {esim.status === 'inactive' && (
          <PrimaryButton
            label="Activate eSIM"
            icon={<Signal size={16} color="#fff" strokeWidth={2.2} />}
            onPress={() => activate(esim.id)}
          />
        )}
        {esim.status === 'active' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PrimaryButton
              label="Top up"
              icon={<Plus size={16} color="#fff" strokeWidth={2.4} />}
              onPress={() => topUp(esim.id, 5)}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label="QR / Install"
              variant="ghost"
              icon={<QrCode size={16} color={t.fg} strokeWidth={2} />}
              onPress={() => Alert.alert('Install', `ICCID ${esim.iccid}`)}
              style={{ flex: 1 }}
            />
          </View>
        )}
        {esim.status === 'expired' && (
          <PrimaryButton
            label="Top up 5 GB"
            icon={<Plus size={16} color="#fff" strokeWidth={2.4} />}
            onPress={() => topUp(esim.id, 5)}
          />
        )}

        {/* Technical details */}
        <View
          style={{
            backgroundColor: t.bgElev,
            borderColor: t.border,
            borderWidth: 1,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {[
            ['ICCID', esim.iccid],
            ['Plan', `${esim.planGb} GB · ${esim.planDays} days`],
            ['Network', 'Auto-select best partner'],
            ['Hotspot', 'Allowed'],
          ].map(([k, v], i, arr) => (
            <View
              key={k}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 13,
                paddingHorizontal: 14,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: t.border,
              }}
            >
              <Text style={{ fontSize: 13, color: t.fgMuted }}>{k}</Text>
              <Text style={{ fontSize: 13, color: t.fg, fontWeight: '600', fontFamily: t.font.bodyMedium }}>
                {v}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 }}
        >
          <Trash2 size={15} color={t.danger} />
          <Text style={{ color: t.danger, fontWeight: '700', fontSize: 13 }}>Remove eSIM</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
