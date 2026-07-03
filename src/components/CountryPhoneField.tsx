import React from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView } from 'react-native';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { useCountryPhoneField } from '@/components/useCountryPhoneField';

/**
 * Phone input with a country/dial-code picker. Defaults to the device region
 * (Iraq/+964 when the SIM/locale is Iraqi), changeable via the picker. Emits a
 * normalized E.164 string (national trunk "0" stripped) through onChange.
 */
export function CountryPhoneField({
  onChange,
  autoFocus,
}: {
  onChange: (e164: string) => void;
  autoFocus?: boolean;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { country, local, open, query, filtered, setQuery, openPicker, closePicker, onChangeLocal, onSelectCountry } =
    useCountryPhoneField({ onChange, autoFocus });

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: t.bgElev,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={() => openPicker()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 14,
            backgroundColor: t.bgSunken,
            borderRightWidth: 1,
            borderRightColor: t.border,
          }}
        >
          <Flag iso={country.iso} size={20} />
          <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', fontSize: 15, color: t.fg }}>
            +{country.dial}
          </Text>
          <ChevronDown size={14} color={t.fgMuted} />
        </Pressable>
        <TextInput
          value={local}
          onChangeText={(v) => onChangeLocal(v)}
          keyboardType="phone-pad"
          autoFocus={autoFocus}
          placeholder="750 123 4567"
          placeholderTextColor={t.fgFaint}
          style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: t.fg, fontFamily: t.font.bodyMedium }}
        />
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => closePicker()}>
        <Pressable onPress={() => closePicker()} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '78%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>{tr('phone.selectCountry')}</Text>
              <Pressable
                onPress={() => closePicker()}
                accessibilityRole="button"
                accessibilityLabel={tr('a11y.close')}
              >
                <X size={20} color={t.fgMuted} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.bgSunken, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 }}>
              <Search size={16} color={t.fgMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={tr('phone.searchPlaceholder')}
                placeholderTextColor={t.fgFaint}
                autoCapitalize="none"
                style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: t.fg, fontFamily: t.font.body }}
              />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.map((c) => {
                const on = c.iso === country.iso;
                return (
                  <Pressable
                    key={c.iso}
                    onPress={() => onSelectCountry(c)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 6 }}
                  >
                    <Flag iso={c.iso} size={24} />
                    <Text style={{ flex: 1, fontSize: 14, color: t.fg, fontWeight: on ? '700' : '500', fontFamily: t.font.bodyMedium }}>
                      {c.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: t.fgMuted }}>+{c.dial}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
