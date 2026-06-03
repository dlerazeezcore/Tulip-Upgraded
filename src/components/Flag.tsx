import React from 'react';
import { View, Platform, Text } from 'react-native';
import { Image } from 'expo-image';
import { SvgUri } from 'react-native-svg';

// Flat, genuinely-circular flags (square SVG whose artwork is a filled circle),
// so they look clean inside a round avatar. Codes are ISO 3166-1 alpha-2
// (plus region codes like 'EU' that circle-flags supports).
const flagUrl = (iso2: string) =>
  `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags/${iso2.toLowerCase()}.svg`;

export function Flag({ iso, size = 22 }: { iso: string; size?: number }) {
  // Some flags (notably the EU flag's eu.svg) fail to render through
  // react-native-svg's SvgUri on device, leaving a blank gray circle — that's
  // why the Euro currency showed "no logo". Track load failures and fall back
  // to a clean code badge so EVERY flag (currencies included) always shows
  // something legible.
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
