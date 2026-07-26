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
  /** Current E.164 value owned by the parent. Supplying it makes the field
   *  CONTROLLED, so clearing or restoring the parent's state is reflected on
   *  screen. Omit for legacy uncontrolled usage. */
  value?: string;
};

/** Split an E.164 string into its country and national part, longest dial code
 *  first so +1 does not shadow +1242. */
function parseE164(e164: string): { country: Country; local: string } | undefined {
  if (!e164.startsWith('+')) return undefined;
  let best: Country | undefined;
  for (const candidate of COUNTRIES) {
    if (!e164.startsWith(`+${candidate.dial}`)) continue;
    if (!best || candidate.dial.length > best.dial.length) best = candidate;
  }
  if (!best) return undefined;
  return { country: best, local: e164.slice(best.dial.length + 1) };
}

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

export function useCountryPhoneField({ onChange, autoFocus, value }: CountryPhoneFieldProps): CountryPhoneFieldViewModel {
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
      if (!detected) return;
      // Never re-home a number the user has already begun typing. This used to
      // setCountry AND re-emit with the existing digits, so a geolocation result
      // landing a moment after the first keystroke silently changed the dial code
      // — and therefore which number we would actually text.
      if (localRef.current) return;
      setCountry(detected);
      // Nothing to emit: there is no subscriber number yet, and a bare dial code
      // is not a phone number.
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Controlled mode: mirror the parent's value into the visible field. Without
  // this the input was write-only — a parent that reset its phone state (e.g.
  // "Change number") kept showing the old digits, and a parent that held a number
  // the field had cleared would send to a number the user could no longer see.
  useEffect(() => {
    if (value === undefined) return; // uncontrolled usage — parent owns nothing
    if (value === toE164(country.dial, local)) return; // already in sync
    if (!value) {
      if (local !== '') {
        setLocal('');
        localRef.current = '';
      }
      return;
    }
    const parsed = parseE164(value);
    if (!parsed) return;
    if (parsed.country.iso !== country.iso) setCountry(parsed.country);
    if (parsed.local !== local) {
      setLocal(parsed.local);
      localRef.current = parsed.local;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
