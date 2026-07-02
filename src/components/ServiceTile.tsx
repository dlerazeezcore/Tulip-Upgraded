// THIN UI — wiring lives in useServiceTile.ts.
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICE_SLOT, Service } from '@/data/services';
import { useServiceTile } from './useServiceTile';
import { PressableScale } from './PressableScale';

type TileProps = {
  svc: Service | typeof SERVICE_SLOT;
  size?: 'sm' | 'md' | 'lg';
};

export function ServiceTile({ svc, size = 'md' }: TileProps) {
  const t = useTheme();
  const { placeholder, live, Icon, color, tint, name, verb, soonLabel, onPress } = useServiceTile(svc);
  const big = size === 'lg';
  const small = size === 'sm';

  const content = (
    <>
      <View
        style={{
          width: big ? 44 : small ? 34 : 38,
          height: big ? 44 : small ? 34 : 38,
          borderRadius: 12,
          backgroundColor: placeholder ? 'transparent' : tint,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: placeholder ? 1.5 : 0,
          borderColor: t.borderStrong,
          borderStyle: 'dashed',
        }}
      >
        <Icon size={big ? 22 : small ? 16 : 18} color={color} strokeWidth={2} />
      </View>
      <View>
        <Text
          numberOfLines={2}
          style={{
            fontSize: big ? 16 : small ? 13 : 14,
            fontFamily: t.font.display,
            fontWeight: '700',
            color: t.fg,
            letterSpacing: -0.2,
          }}
        >
          {name}
        </Text>
        <Text numberOfLines={2} style={{ fontSize: 11, color: t.fgMuted, marginTop: 2 }}>
          {verb}
        </Text>
      </View>
    </>
  );

  if (placeholder) {
    return (
      <View
        style={{
          padding: big ? 18 : small ? 12 : 14,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: t.borderStrong,
          borderStyle: 'dashed',
          gap: big ? 14 : 10,
          opacity: 0.6,
          height: big ? 148 : small ? 108 : 132,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      style={{
        padding: big ? 18 : small ? 12 : 14,
        borderRadius: 16,
        backgroundColor: t.bgElev,
        borderWidth: 1,
        borderColor: t.border,
        gap: big ? 14 : 10,
        height: big ? 148 : small ? 108 : 132,
        ...t.shadow1,
      }}
    >
      {!live && (
        <View
          style={{
            position: 'absolute',
            top: 8,
            end: 8,
            backgroundColor: t.bgSunken,
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {soonLabel}
          </Text>
        </View>
      )}
      {content}
    </PressableScale>
  );
}
