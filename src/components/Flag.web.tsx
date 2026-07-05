import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme/ThemeContext';

// WEB flag. Fetches the circular flag from the CDN via expo-image (works well
// on web) and — crucially — does NOT import the bundled svg map (src/data/
// flagSvgs.ts, ~190KB), so that map never lands in the web bundle. The native
// variant (Flag.tsx) renders the same artwork from the local map via SvgXml.
// Metro resolves this `.web.tsx` file on web and `Flag.tsx` on native.
//
// circle-flags stores a few region flags as symlinks (e.g. flags/eu.svg ->
// european_union.svg) that jsDelivr does NOT follow, so map known aliases to
// their real filenames. Missing codes / load errors fall back to a code badge.
const FLAG_ALIASES: Record<string, string> = {
  eu: 'european_union',
};

const flagUrl = (iso2: string) => {
  const key = (iso2 || '').toLowerCase();
  const file = FLAG_ALIASES[key] ?? key;
  return `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags/${file}.svg`;
};

export function Flag({ iso, size = 22 }: { iso: string; size?: number }) {
  const t = useTheme();
  const [errored, setErrored] = React.useState(false);
  const code = (iso || '').toUpperCase();

  // Reset the error flag if the iso changes (e.g. list row re-use).
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
        backgroundColor: t.bgSunken,
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
            color: t.fgMuted,
            letterSpacing: 0.2,
          }}
        >
          {code.slice(0, 2)}
        </Text>
      ) : (
        <Image
          source={flagUrl(iso)}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          onError={() => setErrored(true)}
        />
      )}
    </View>
  );
}
