// Best-effort IP geolocation → ISO country code (web + native).
//
// NOTE: this hits a THIRD-PARTY endpoint (get.geojs.io), not our own backend,
// so a raw `fetch` is correct here — do NOT route it through `apiFetch`, which
// targets our API.

/** Best-effort IP geolocation → ISO country code (web + native). */
export async function detectCountryByIp(): Promise<string | null> {
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
