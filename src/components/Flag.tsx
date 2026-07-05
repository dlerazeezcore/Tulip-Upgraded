import React from 'react';
import { View, Text } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';
import { FLAG_SVGS } from '@/data/flagSvgs';

// NATIVE flag (iOS + Android). Renders from the LOCALLY-BUNDLED svg map via
// react-native-svg's SvgXml — never a remote fetch. The old native path used
// SvgUri to fetch each flag from a CDN; under the New Architecture that remote
// fetch renders blank on Android (the request path that works on iOS Fabric
// silently fails on Android Fabric), so every flag fell back to a code badge.
// A bundled string map removes the network entirely: flags are instant, offline
// and identical on every device.
//
// The WEB variant lives in Flag.web.tsx (expo-image + CDN). Keeping them in
// separate platform files means the ~190KB svg map is imported ONLY here and is
// never pulled into the web bundle. Codes are ISO 3166-1 alpha-2 (plus region
// codes like 'eu'). Missing/unknown codes fall back to a clean code badge.
export function Flag({ iso, size = 22 }: { iso: string; size?: number }) {
  const t = useTheme();
  const code = (iso || '').toUpperCase();
  const xml = FLAG_SVGS[(iso || '').toLowerCase()];

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
      {!iso || !xml ? (
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
        <SvgXml xml={xml} width={size} height={size} />
      )}
    </View>
  );
}
