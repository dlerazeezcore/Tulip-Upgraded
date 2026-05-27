import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { ChevronLeft, Plus, Trash2, X, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/state/authStore';
import { listFeaturedLocations, saveFeaturedLocation, deleteFeaturedLocation } from '@/services/admin';
import type { FeaturedLocationAdmin } from '@/services/types';

export default function AdminFeatured() {
  const t = useTheme();
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);

  const [rows, setRows] = useState<FeaturedLocationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const load = () => {
    setLoading(true);
    listFeaturedLocations()
      .then(setRows)
      .catch((e: any) => Alert.alert('Error', e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) return <Redirect href="/(tabs)/profile" />;

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); load(); } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const onAdd = () =>
    run(async () => {
      if (!code.trim() || !name.trim()) return;
      await saveFeaturedLocation({ code, name, sortOrder: parseInt(sortOrder, 10) || 0, isPopular: true, enabled: true });
      setAdding(false); setCode(''); setName(''); setSortOrder('0');
    });

  const toggleEnabled = (row: FeaturedLocationAdmin) =>
    run(() => saveFeaturedLocation({
      code: row.code, name: row.name, sortOrder: row.sort_order ?? 0,
      isPopular: row.is_popular ?? true, enabled: !(row.enabled ?? true), locationType: row.location_type,
    }));

  const onDelete = (row: FeaturedLocationAdmin) =>
    Alert.alert('Remove', `Remove ${row.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => run(() => deleteFeaturedLocation(row.id)) },
    ]);

  const numStyle = {
    backgroundColor: t.bgElev, borderColor: t.border, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: t.fg, fontFamily: t.font.bodyMedium,
  } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin'))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>Popular destinations</Text>
        <Pressable onPress={() => setAdding(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: t.primary }}>
          <Plus size={14} color="#fff" strokeWidth={2.6} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10, maxWidth: 780, width: '100%', alignSelf: 'center' }}>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={t.primary} /></View>
        ) : (
          <View style={{ backgroundColor: t.bgElev, borderRadius: 14, borderColor: t.border, borderWidth: 1, overflow: 'hidden' }}>
            {rows.map((r, i) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: t.border, opacity: (r.enabled ?? true) ? 1 : 0.5 }}>
                <Flag iso={r.code} size={28} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 14, color: t.fg }}>{r.name}</Text>
                  <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>{r.code} · order {r.sort_order ?? 0}</Text>
                </View>
                <Pressable onPress={() => toggleEnabled(r)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                  {(r.enabled ?? true) ? <Eye size={15} color={t.fg} /> : <EyeOff size={15} color={t.fgMuted} />}
                </Pressable>
                <Pressable onPress={() => onDelete(r)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(220,38,38,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={15} color={t.danger} />
                </Pressable>
              </View>
            ))}
            {rows.length === 0 && <Text style={{ color: t.fgMuted, textAlign: 'center', padding: 20 }}>No popular destinations yet.</Text>}
          </View>
        )}
      </ScrollView>

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <Pressable onPress={() => setAdding(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>Add destination</Text>
              <Pressable onPress={() => setAdding(false)}><X size={20} color={t.fgMuted} /></Pressable>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>Country code (ISO-2)</Text>
              <TextInput value={code} onChangeText={(v) => setCode(v.toUpperCase().slice(0, 2))} placeholder="US" placeholderTextColor={t.fgFaint} autoCapitalize="characters" style={numStyle} />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>Display name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="United States" placeholderTextColor={t.fgFaint} style={numStyle} />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase' }}>Sort order</Text>
              <TextInput value={sortOrder} onChangeText={(v) => setSortOrder(v.replace(/[^\d]/g, ''))} keyboardType="number-pad" placeholder="0" placeholderTextColor={t.fgFaint} style={numStyle} />
            </View>
            <PrimaryButton label={busy ? 'Saving…' : 'Add destination'} onPress={onAdd} style={{ marginTop: 4 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
