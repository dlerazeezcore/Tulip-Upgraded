// Wiring for <CountryPhoneField />.
//
// Owns:
//   - country / local / open / query state and the userPicked + local refs.
//   - The mount effect that refines the default country via IP geolocation
//     (skipped once the user has picked a country).
//   - The filtered country list for the picker search.
//   - Handlers for selecting a country, editing the number, and opening/closing
//     the picker — each composes the normalized E.164 value and emits it via onChange.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Localization from 'expo-localization';
import { COUNTRIES, DEFAULT_COUNTRY, findCountryByIso, toE164, type Country } from '@/data/countries';
import { detectCountryByIp } from '@/lib/geoip';

function localeCountry(): Country | undefined {
  try {
    return findCountryByIso(Localization.getLocales?.()[0]?.regionCode);
  } catch {
    return undefined;
  }
}

export type CountryPhoneFieldProps = {
  onChange: (e164: string) => void;
  autoFocus?: boolean;
};

export type CountryPhoneFieldViewModel = {
  country: Country;
  local: string;
  open: boolean;
  query: string;
  filtered: Country[];
  autoFocus?: boolean;
  setQuery: (q: string) => void;
  openPicker: () => void;
  closePicker: () => void;
  onChangeLocal: (v: string) => void;
  onSelectCountry: (c: Country) => void;
};

export function useCountryPhoneField({ onChange, autoFocus }: CountryPhoneFieldProps): CountryPhoneFieldViewModel {
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

  const openPicker = () => setOpen(true);
  const closePicker = () => setOpen(false);

  const onChangeLocal = (v: string) => {
    const digits = v.replace(/[^\d]/g, '').slice(0, 13);
    setLocal(digits);
    localRef.current = digits;
    emit(country, digits);
  };

  const onSelectCountry = (c: Country) => {
    userPicked.current = true;
    setCountry(c);
    setOpen(false);
    emit(c, local);
  };

  return {
    country,
    local,
    open,
    query,
    filtered,
    autoFocus,
    setQuery,
    openPicker,
    closePicker,
    onChangeLocal,
    onSelectCountry,
  };
}
