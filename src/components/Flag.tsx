import React from 'react';
import { View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SvgUri } from 'react-native-svg';

const flagUrl = (iso2: string) => {
  const cps = [...iso2.toUpperCase()]
    .map((c) => (c.charCodeAt(0) - 65 + 0x1f1e6).toString(16))
    .join('-');
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${cps}.svg`;
};

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
      }}
    >
      {Platform.OS === 'web' ? (
        <Image source={uri} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <SvgUri uri={uri} width={size} height={size} />
      )}
    </View>
  );
}
