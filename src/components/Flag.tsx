import React from 'react';
import { View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SvgUri } from 'react-native-svg';

// Flat, genuinely-circular flags (square SVG whose artwork is a filled circle),
// so they look clean inside a round avatar. Codes are ISO 3166-1 alpha-2.
const flagUrl = (iso2: string) =>
  `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags/${iso2.toLowerCase()}.svg`;

export function Flag({ iso, size = 22 }: { iso: string; size?: number }) {
  const uri = flagUrl(iso);
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
      {Platform.OS === 'web' ? (
        <Image source={uri} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
      ) : (
        <SvgUri uri={uri} width={size} height={size} />
      )}
    </View>
  );
}
