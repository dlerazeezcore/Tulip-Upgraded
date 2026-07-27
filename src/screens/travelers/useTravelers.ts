import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { confirmAction, notify } from '@/lib/dialog';
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
  // The per-platform branching this used to do now lives in @/lib/dialog, so
  // every confirm in the app behaves the same way.
  const removeFailed = (e: any) => notify(tt('common.error'), e?.message || tt('travelers.failed'));
  const onRemove = async (id: number) => {
    const confirmed = await confirmAction({
      title: tt('travelers.removeTitle'),
      message: tt('travelers.removeBody'),
      confirmLabel: tt('travelers.remove'),
      cancelLabel: tt('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    await remove(id).catch(removeFailed);
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
