import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Pencil, Trash2, User, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useTravelersStore, type Traveler } from '@/state/travelersStore';
import { useIsWideWeb } from '@/lib/responsive';

const RELATIONS = ['Primary', 'Spouse', 'Child', 'Parent', 'Other'];

export default function Travelers() {
  const t = useTheme();
  const router = useRouter();
  const isWide = useIsWideWeb();
  const { travelers, add, update, remove, refresh } = useTravelersStore();

  const [editing, setEditing] = useState<Traveler | 'new' | null>(null);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Primary');
  const [dob, setDob] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openNew = () => {
    setEditing('new');
    setName('');
    setRelation('Primary');
    setDob('');
  };
  const openEdit = (tr: Traveler) => {
    setEditing(tr);
    setName(tr.name);
    setRelation(tr.relation || 'Primary');
    setDob(tr.dob || '');
  };
  const save = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      if (editing === 'new') await add({ name: name.trim(), relation, dob: dob.trim() });
      else if (editing) await update(editing.id, { name: name.trim(), relation, dob: dob.trim() });
      setEditing(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save traveler');
    } finally {
      setBusy(false);
    }
  };
  const onRemove = (id: number) => {
    Alert.alert('Remove traveler', 'Remove this traveler?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { remove(id).catch((e: any) => Alert.alert('Error', e?.message || 'Failed')); } },
    ]);
  };

  const inputStyle = {
    backgroundColor: t.bgElev,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: t.fg,
    fontFamily: t.font.bodyMedium,
  } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          Saved travelers
        </Text>
        <Pressable
          onPress={openNew}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: t.primary }}
        >
          <Plus size={14} color="#fff" strokeWidth={2.6} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 40, maxWidth: isWide ? 900 : 720, width: '100%', alignSelf: 'center' }}>
       <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: isWide ? -5 : 0, gap: isWide ? 0 : 10 }}>
        {travelers.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 70, gap: 12, width: '100%' }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
              <User size={30} color={t.fgMuted} />
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>No travelers yet</Text>
            <Text style={{ fontSize: 13, color: t.fgMuted }}>Add travelers to speed up checkout.</Text>
            <PrimaryButton label="Add traveler" icon={<Plus size={15} color="#fff" strokeWidth={2.4} />} onPress={openNew} />
          </View>
        ) : (
          travelers.map((tr) => (
            <View key={tr.id} style={{ width: isWide ? '50%' : '100%', padding: isWide ? 5 : 0 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor: t.bgElev,
                borderColor: t.border,
                borderWidth: 1,
                ...t.shadow1,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 15, color: t.fg }}>
                  {tr.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>{tr.name}</Text>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                  {tr.relation}{tr.dob ? ` · ${tr.dob}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => openEdit(tr)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                <Pencil size={15} color={t.fg} />
              </Pressable>
              <Pressable onPress={() => onRemove(tr.id)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(220,38,38,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={15} color={t.danger} />
              </Pressable>
            </View>
            </View>
          ))
        )}
       </View>
      </ScrollView>

      {/* Add / edit modal */}
      <Modal visible={editing !== null} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <Pressable onPress={() => setEditing(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
                {editing === 'new' ? 'Add traveler' : 'Edit traveler'}
              </Text>
              <Pressable onPress={() => setEditing(null)}>
                <X size={20} color={t.fgMuted} />
              </Pressable>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Full name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Jane Olsen" placeholderTextColor={t.fgFaint} style={inputStyle} />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Relation</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {RELATIONS.map((r) => {
                  const on = r === relation;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRelation(r)}
                      style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? t.primary : t.bgSunken }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: t.font.displayMedium, color: on ? '#fff' : t.fgMuted }}>{r}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Date of birth</Text>
              <TextInput value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" placeholderTextColor={t.fgFaint} style={inputStyle} />
            </View>

            <PrimaryButton label={busy ? 'Saving…' : editing === 'new' ? 'Add traveler' : 'Save changes'} onPress={save} style={{ marginTop: 4 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
