import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { ChevronLeft, Globe } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { useAuthStore } from '@/state/authStore';
import { getAdminOrders } from '@/services/admin';
import type { AdminOrder } from '@/services/types';
import { formatIqd } from '@/lib/pricing';

const ESIM_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'installed', label: 'Installed' },
  { id: 'not_installed', label: 'Not installed' },
  { id: 'expired', label: 'Expired' },
  { id: 'used', label: 'Data used' },
];

const ESIM_LABEL: Record<string, string> = {
  installed: 'Installed',
  not_installed: 'Not installed',
  expired: 'Expired',
  used: 'Data used',
  pending: 'Pending',
};

function orderDate(o: AdminOrder): string {
  return o.bookedAt || o.createdAt || '';
}
function monthKey(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(key: string): string {
  if (!key) return '—';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

export default function AdminOrders() {
  const t = useTheme();
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>('all');
  const [esim, setEsim] = useState<string>('all');

  useEffect(() => {
    getAdminOrders()
      .then(setOrders)
      .catch((e: any) => setError(e?.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const months = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { const k = monthKey(orderDate(o)); if (k) set.add(k); });
    return ['all', ...Array.from(set).sort().reverse()];
  }, [orders]);

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (month === 'all' || monthKey(orderDate(o)) === month) &&
          (esim === 'all' || o.esimStatus === esim),
      ),
    [orders, month, esim],
  );

  if (!isAdmin) return <Redirect href="/(tabs)/profile" />;

  const Chip = ({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? t.primary : t.bgSunken }}>
      <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 12, color: on ? '#fff' : t.fgMuted }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin'))}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          All orders{loading ? '' : ` · ${orders.length}`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14, maxWidth: 820, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {months.map((m) => <Chip key={m} on={month === m} label={m === 'all' ? 'All' : monthLabel(m)} onPress={() => setMonth(m)} />)}
          </ScrollView>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4 }}>eSIM status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {ESIM_FILTERS.map((f) => <Chip key={f.id} on={esim === f.id} label={f.label} onPress={() => setEsim(f.id)} />)}
          </ScrollView>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
        ) : error ? (
          <Text style={{ color: t.danger, textAlign: 'center', paddingVertical: 20 }}>{error}</Text>
        ) : filtered.length === 0 ? (
          <Text style={{ color: t.fgMuted, textAlign: 'center', paddingVertical: 40 }}>No orders match these filters.</Text>
        ) : (
          <View style={{ backgroundColor: t.bgElev, borderRadius: 16, borderColor: t.border, borderWidth: 1, overflow: 'hidden', ...t.shadow1 }}>
            {filtered.map((o, i) => {
              const it = o.items[0];
              return (
                <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: i === filtered.length - 1 ? 0 : 1, borderBottomColor: t.border }}>
                  {it?.countryCode ? <Flag iso={it.countryCode} size={34} /> : (
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={18} color={t.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>
                      {o.user?.name || 'Unknown'} <Text style={{ color: t.fgMuted, fontWeight: '400' }}>· {o.user?.phone || ''}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                      {it?.countryName || it?.packageName || 'eSIM'}{orderDate(o) ? ` · ${new Date(orderDate(o)).toLocaleDateString()}` : ''}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: t.bgSunken }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: t.fgMuted, letterSpacing: 0.3 }}>
                          {(ESIM_LABEL[o.esimStatus] || o.esimStatus).toUpperCase()}
                        </Text>
                      </View>
                      {o.paymentMethod ? <Text style={{ fontSize: 10, color: t.fgFaint }}>{o.paymentMethod}</Text> : null}
                    </View>
                  </View>
                  <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg }}>{formatIqd(o.totalMinor ?? 0)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
