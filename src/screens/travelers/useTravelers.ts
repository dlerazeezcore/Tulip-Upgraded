import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTravelersStore, type Traveler } from '@/state/travelersStore';
import { useIsWideWeb } from '@/lib/responsive';
import { initials } from '@/lib/initials';

export function useTravelers() {
  const { t: tt } = useTranslation();
  const router = useRouter();
  const isWide = useIsWideWeb();
  const { travelers, add, update, remove, refresh, loading, loaded, error } = useTravelersStore();

  // Pre-shape rows with avatar initials so the list renders fields only.
  const rows = travelers.map((tr) => ({ ...tr, initials: initials(tr.name) }));

  const [editing, setEditing] = useState<Traveler | 'new' | null>(null);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Primary');
  const [dob, setDob] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openNew = () => {
    setEditing('new');
    setName('');
    setRelation('Primary');
    setDob('');
    setSaveError(null);
  };
  const openEdit = (tr: Traveler) => {
    setEditing(tr);
    setName(tr.name);
    setRelation(tr.relation || 'Primary');
    setDob(tr.dob || '');
    setSaveError(null);
  };
  const save = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setSaveError(null);
    try {
      if (editing === 'new') await add({ name: name.trim(), relation, dob: dob.trim() });
      else if (editing) await update(editing.id, { name: name.trim(), relation, dob: dob.trim() });
      setEditing(null);
    } catch (e: any) {
      // Inline error in the sheet — Alert.alert is a NO-OP on react-native-web,
      // so an alert-only failure path is invisible in the web build.
      setSaveError(e?.message || tt('travelers.couldNotSave'));
    } finally {
      setBusy(false);
    }
  };
  const removeFailed = (e: any) => {
    const message = e?.message || tt('travelers.failed');
    if (Platform.OS === 'web') window.alert(message);
    else Alert.alert(tt('common.error'), message);
  };
  const onRemove = (id: number) => {
    // Alert.alert (and its buttons) is a no-op on react-native-web, which made
    // web deletes do literally nothing — use the browser confirm there.
    if (Platform.OS === 'web') {
      if (window.confirm(`${tt('travelers.removeTitle')}\n${tt('travelers.removeBody')}`)) {
        remove(id).catch(removeFailed);
      }
      return;
    }
    Alert.alert(tt('travelers.removeTitle'), tt('travelers.removeBody'), [
      { text: tt('common.cancel'), style: 'cancel' },
      { text: tt('travelers.remove'), style: 'destructive', onPress: () => { remove(id).catch(removeFailed); } },
    ]);
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  return {
    isWide,
    travelers: rows,
    /** First snapshot still on its way — show the loading placeholder. */
    firstLoading: loading && !loaded,
    /** First load failed with nothing to show — render ErrorState, not "no travelers". */
    errored: !loaded && !loading && !!error,
    retry: () => {
      void refresh();
    },
    editing,
    setEditing,
    name,
    setName,
    relation,
    setRelation,
    dob,
    setDob,
    busy,
    saveError,
    openNew,
    openEdit,
    save,
    onRemove,
    goBack,
  };
}
