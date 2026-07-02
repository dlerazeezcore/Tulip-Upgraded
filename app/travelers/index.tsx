// THIN UI — wiring lives in src/screens/travelers/useTravelers.ts.
import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, User, X } from 'lucide-react-native';
import { DirectionalChevron } from '@/components/DirectionalChevron';
import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useTravelers } from '@/screens/travelers/useTravelers';

const RELATIONS = ['Primary', 'Spouse', 'Child', 'Parent', 'Other'];

export default function Travelers() {
  const t = useTheme();
  const { t: tt } = useTranslation();
  const vm = useTravelers();
  const {
    isWide, travelers, editing, setEditing, name, setName,
    relation, setRelation, dob, setDob, busy, openNew, openEdit, save, onRemove,
  } = vm;

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
          onPress={vm.goBack}
          accessibilityRole="button"
          accessibilityLabel={tt('a11y.back')}
          hitSlop={4} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}
        >
          <DirectionalChevron direction="back" size={18} color={t.fg} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg }}>
          {tt('travelers.title')}
        </Text>
        <Pressable
          onPress={openNew}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: t.primary }}
        >
          <Plus size={14} color={t.onPrimary} strokeWidth={2.6} />
          <Text style={{ color: t.onPrimary, fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>{tt('travelers.add')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: isWide ? 28 : 20, paddingBottom: 40, maxWidth: isWide ? 900 : 720, width: '100%', alignSelf: 'center' }}>
       <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: isWide ? -5 : 0, gap: isWide ? 0 : 10 }}>
        {travelers.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 70, gap: 12, width: '100%' }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
              <User size={30} color={t.fgMuted} />
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 16, color: t.fg }}>{tt('travelers.noTravelersTitle')}</Text>
            <Text style={{ fontSize: 13, color: t.fgMuted }}>{tt('travelers.noTravelersSub')}</Text>
            <PrimaryButton label={tt('travelers.addTraveler')} icon={<Plus size={15} color={t.onPrimary} strokeWidth={2.4} />} onPress={openNew} />
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
                  {tr.initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>{tr.name}</Text>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 1 }}>
                  {tt(`travelers.relations.${tr.relation}`, { defaultValue: tr.relation })}{tr.dob ? ` · ${tr.dob}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => openEdit(tr)} accessibilityRole="button" accessibilityLabel={tt('travelers.editTraveler')} hitSlop={4} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bgSunken, alignItems: 'center', justifyContent: 'center' }}>
                <Pencil size={15} color={t.fg} />
              </Pressable>
              <Pressable onPress={() => onRemove(tr.id)} accessibilityRole="button" accessibilityLabel={tt('travelers.removeTitle')} hitSlop={4} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.dangerBg, alignItems: 'center', justifyContent: 'center' }}>
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
                {editing === 'new' ? tt('travelers.addTraveler') : tt('travelers.editTraveler')}
              </Text>
              <Pressable onPress={() => setEditing(null)} accessibilityRole="button" accessibilityLabel={tt('a11y.close')}>
                <X size={20} color={t.fgMuted} />
              </Pressable>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tt('travelers.fullName')}</Text>
              <TextInput value={name} onChangeText={setName} placeholder={tt('travelers.namePlaceholder')} placeholderTextColor={t.fgFaint} style={inputStyle} />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tt('travelers.relation')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {RELATIONS.map((r) => {
                  const on = r === relation;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRelation(r)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? t.primary : t.bgSunken }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: t.font.displayMedium, color: on ? t.onPrimary : t.fgMuted }}>{tt(`travelers.relations.${r}`, { defaultValue: r })}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tt('travelers.dob')}</Text>
              <TextInput value={dob} onChangeText={setDob} placeholder={tt('travelers.dobPlaceholder')} placeholderTextColor={t.fgFaint} style={inputStyle} />
            </View>

            <PrimaryButton label={busy ? tt('travelers.saving') : editing === 'new' ? tt('travelers.addTraveler') : tt('travelers.saveChanges')} onPress={save} style={{ marginTop: 4 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
