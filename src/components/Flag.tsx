import React from 'react';
import { View, Platform, Text } from 'react-native';
import { Image } from 'expo-image';
import { SvgUri } from 'react-native-svg';

// Flat, genuinely-circular flags (square SVG whose artwork is a filled circle),
// so they look clean inside a round avatar. Codes are ISO 3166-1 alpha-2
// (plus region codes like 'EU' that circle-flags supports).
//
// circle-flags stores a few region flags as symlinks (e.g. flags/eu.svg ->
// european_union.svg). jsDelivr does NOT follow the symlink — it serves the
// target *filename as plain text* ("european_union.svg", 18 bytes) with a 200
// status, so the raw `eu.svg` URL yields no valid SVG and renders blank (and
// never fires onError, since the HTTP request itself "succeeded"). Map known
// aliases to their real filenames so they resolve to actual artwork.
const FLAG_ALIASES: Record<string, string> = {
  eu: 'european_union',
};

const flagUrl = (iso2: string) => {
  const key = (iso2 || '').toLowerCase();
  const file = FLAG_ALIASES[key] ?? key;
  return `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags/${file}.svg`;
};

export function Flag({ iso, size = 22 }: { iso: string; size?: number }) {
  // Defensive fallback: if a flag URL genuinely fails to load (network error,
  // missing code), fall back to a clean code badge so EVERY flag always shows
  // something legible instead of a blank gray circle. (The EU/Euro "no logo"
  // bug was a bad CDN URL — see FLAG_ALIASES above — not a render failure.)
  const [errored, setErrored] = React.useState(false);
  const code = (iso || '').toUpperCase();

  // Reset the error flag if the iso changes (e.g. list re-use).
  React.useEffect(() => {
    setErrored(false);
  }, [iso]);

  const showFallback = !iso || errored;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {showFallback ? (
        <Text
          allowFontScaling={false}
          style={{
            fontSize: Math.max(8, Math.round(size * 0.36)),
            fontWeight: '800',
            color: '#4B5563',
            letterSpacing: 0.2,
          }}
        >
          {code.slice(0, 2)}
        </Text>
      ) : Platform.OS === 'web' ? (
        <Image
          source={flagUrl(iso)}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <SvgUri
          uri={flagUrl(iso)}
          width={size}
          height={size}
          onError={() => setErrored(true)}
        />
      )}
    </View>
  );
}
