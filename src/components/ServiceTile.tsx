import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICES, SERVICE_SLOT, Service, serviceRoute } from '@/data/services';
import { useSearchStore } from '@/state/searchStore';
import { PressableScale } from './PressableScale';

type TileProps = {
  svc: Service | typeof SERVICE_SLOT;
  size?: 'sm' | 'md' | 'lg';
};

export function ServiceTile({ svc, size = 'md' }: TileProps) {
  const t = useTheme();
  const router = useRouter();
  const setActive = useSearchStore((s) => s.setActive);
  const big = size === 'lg';
  const small = size === 'sm';
  const placeholder = (svc as any).placeholder;
  const Icon = svc.Icon;

  const onPress = () => {
    if (placeholder) return;
    setActive(svc.id as Service['id']);
    router.push(serviceRoute(svc.id) as any);
  };

  const content = (
    <>
      <View
        style={{
          width: big ? 44 : small ? 34 : 38,
          height: big ? 44 : small ? 34 : 38,
          borderRadius: 12,
          backgroundColor: placeholder ? 'transparent' : svc.tint,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: placeholder ? 1.5 : 0,
          borderColor: t.borderStrong,
          borderStyle: 'dashed',
        }}
      >
        <Icon size={big ? 22 : small ? 16 : 18} color={svc.color} strokeWidth={2} />
      </View>
      <View>
        <Text
          style={{
            fontSize: big ? 16 : small ? 13 : 14,
            fontFamily: t.font.display,
            fontWeight: '700',
            color: t.fg,
            letterSpacing: -0.2,
          }}
        >
          {svc.label}
        </Text>
        <Text style={{ fontSize: 11, color: t.fgMuted, marginTop: 2 }}>
          {placeholder ? 'New services soon' : svc.verb}
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
          minHeight: big ? 130 : small ? 92 : 110,
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
        minHeight: big ? 130 : small ? 92 : 110,
        ...t.shadow1,
      }}
    >
      {content}
    </PressableScale>
  );
}
