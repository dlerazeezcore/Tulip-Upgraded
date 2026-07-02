import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTravelersStore, type Traveler } from '@/state/travelersStore';
import { useIsWideWeb } from '@/lib/responsive';
import { initials } from '@/lib/initials';

export function useTravelers() {
  const { t: tt } = useTranslation();
  const router = useRouter();
  const isWide = useIsWideWeb();
  const { travelers, add, update, remove, refresh } = useTravelersStore();

  // Pre-shape rows with avatar initials so the list renders fields only.
  const rows = travelers.map((tr) => ({ ...tr, initials: initials(tr.name) }));

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
      Alert.alert(tt('common.error'), e?.message || tt('travelers.couldNotSave'));
    } finally {
      setBusy(false);
    }
  };
  const onRemove = (id: number) => {
    Alert.alert(tt('travelers.removeTitle'), tt('travelers.removeBody'), [
      { text: tt('common.cancel'), style: 'cancel' },
      { text: tt('travelers.remove'), style: 'destructive', onPress: () => { remove(id).catch((e: any) => Alert.alert(tt('common.error'), e?.message || tt('travelers.failed'))); } },
    ]);
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  return {
    isWide,
    travelers: rows,
    editing,
    setEditing,
    name,
    setName,
    relation,
    setRelation,
    dob,
    setDob,
    busy,
    openNew,
    openEdit,
    save,
    onRemove,
    goBack,
  };
}
