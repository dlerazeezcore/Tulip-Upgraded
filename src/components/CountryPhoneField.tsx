import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView } from 'react-native';
import * as Localization from 'expo-localization';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flag } from '@/components/Flag';
import { COUNTRIES, DEFAULT_COUNTRY, findCountryByIso, toE164, type Country } from '@/data/countries';

/** Best-effort IP geolocation → ISO country code (web + native). */
async function detectCountryByIp(): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch('https://get.geojs.io/v1/ip/country.json', { signal: ctrl.signal });
    clearTimeout(timer);
    const data = await res.json();
    const code = String(data?.country ?? '').toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

function localeCountry(): Country | undefined {
  try {
    return findCountryByIso(Localization.getLocales?.()[0]?.regionCode);
  } catch {
    return undefined;
  }
}

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
  // Default to Iraq instantly; refine via IP geolocation unless the user picks one.
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [local, setLocal] = useState('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const userPicked = useRef(false);
  const localRef = useRef('');

  const emit = (c: Country, l: string) => onChange(toE164(c.dial, l));

  useEffect(() => {
    let cancelled = false;
    detectCountryByIp().then((iso) => {
      if (cancelled || userPicked.current) return;
      const detected = (iso && findCountryByIso(iso)) || localeCountry();
      if (detected) {
        setCountry(detected);
        emit(detected, localRef.current);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.iso.toLowerCase().includes(q));
  }, [query]);

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
          onPress={() => setOpen(true)}
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
          onChangeText={(v) => {
            const digits = v.replace(/[^\d]/g, '').slice(0, 13);
            setLocal(digits);
            localRef.current = digits;
            emit(country, digits);
          }}
          keyboardType="phone-pad"
          autoFocus={autoFocus}
          placeholder="750 123 4567"
          placeholderTextColor={t.fgFaint}
          style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: t.fg, fontFamily: t.font.bodyMedium }}
        />
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '78%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>Select country</Text>
              <Pressable onPress={() => setOpen(false)}>
                <X size={20} color={t.fgMuted} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.bgSunken, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 }}>
              <Search size={16} color={t.fgMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search country or code"
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
                    onPress={() => {
                      userPicked.current = true;
                      setCountry(c);
                      setOpen(false);
                      emit(c, local);
                    }}
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
