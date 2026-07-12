// THIN UI — wiring lives in useServiceTile.ts.
import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { SERVICE_SLOT, Service } from '@/data/services';
import { useServiceTile } from './useServiceTile';
import { DirectionalArrow } from './DirectionalArrow';
import { PressableScale } from './PressableScale';

type TileProps = {
  svc: Service | typeof SERVICE_SLOT;
  /** `sm`/`md`: compact home-grid tile. `lg`: the services-screen big card
   *  (decorative tint circle + "Open" CTA pill). */
  size?: 'sm' | 'md' | 'lg';
};

export function ServiceTile({ svc, size = 'md' }: TileProps) {
  const t = useTheme();
  const { placeholder, live, Icon, color, tint, name, verb, soonLabel, openLabel, onPress } =
    useServiceTile(svc);
  const big = size === 'lg';
  const small = size === 'sm';

  // Coming-soon tiles render as a plain, non-pressable View (no onPress, no
  // scale feedback) so a "Soon" service can't be tapped. Live tiles keep the
  // PressableScale interaction.
  const Wrapper: React.ComponentType<any> = live ? PressableScale : View;
  const wrapperProps = (base: ViewStyle) =>
    live ? { onPress, scaleTo: big ? 0.98 : 0.96, style: base } : { style: base };

  // Big services-screen card. Content-sized (no fixed height) so long ar/ku
  // strings grow the card instead of overflowing; flex:1 keeps wrap-grid rows even.
  if (big && !placeholder) {
    return (
      <Wrapper
        {...wrapperProps({
          flex: 1,
          padding: 22,
          borderRadius: t.radius.card,
          backgroundColor: t.bgElev,
          borderColor: t.border,
          borderWidth: 1,
          overflow: 'hidden',
        })}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -30,
            end: -30,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: tint,
            opacity: 0.6,
          }}
        />
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: t.radius.md,
            backgroundColor: tint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={26} color={color} strokeWidth={2} />
        </View>
        <Text style={{ fontFamily: t.font.display, fontSize: 20, fontWeight: '700', color: t.fg, marginTop: 14 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 13, color: t.fgMuted, marginTop: 4, lineHeight: 18 }}>
          {verb}
        </Text>
        {/* Non-live services show a "Soon" chip instead of an "Open" CTA, and
            the card itself is non-pressable (see Wrapper) so the tap is a
            genuine no-op rather than a dead-end into a coming-soon screen. */}
        {live ? (
          <View
            style={{
              marginTop: 16,
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 16,
              backgroundColor: color,
              borderRadius: t.radius.pill,
            }}
          >
            <Text style={{ color: t.onPrimary, fontWeight: '700', fontSize: 12, fontFamily: t.font.displayMedium }}>
              {openLabel}
            </Text>
            <DirectionalArrow size={12} color={t.onPrimary} strokeWidth={2.4} />
          </View>
        ) : (
          <View
            style={{
              marginTop: 16,
              alignSelf: 'flex-start',
              backgroundColor: t.bgSunken,
              borderRadius: t.radius.pill,
              paddingVertical: 8,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {soonLabel}
            </Text>
          </View>
        )}
      </Wrapper>
    );
  }

  const content = (
    <>
      <View
        style={{
          width: big ? 44 : small ? 34 : 38,
          height: big ? 44 : small ? 34 : 38,
          borderRadius: t.radius.badge,
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

  // minHeight (not height) so long titles/subtitles — ar/ku strings, Android
  // font metrics, font scaling — grow the card instead of spilling past its
  // border; flex:1 stretches every tile to its wrap-grid row so rows stay even.
  if (placeholder) {
    return (
      <View
        style={{
          flex: 1,
          padding: big ? 18 : small ? 12 : 14,
          borderRadius: t.radius.card,
          borderWidth: 1.5,
          borderColor: t.borderStrong,
          borderStyle: 'dashed',
          gap: big ? 14 : 10,
          opacity: 0.6,
          minHeight: big ? 148 : small ? 108 : 132,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <Wrapper
      {...wrapperProps({
        flex: 1,
        padding: big ? 18 : small ? 12 : 14,
        borderRadius: t.radius.card,
        backgroundColor: t.bgElev,
        borderWidth: 1,
        borderColor: t.border,
        gap: big ? 14 : 10,
        minHeight: big ? 148 : small ? 108 : 132,
        // Coming-soon tiles read slightly recessed so "Soon" is legible at a glance.
        opacity: live ? 1 : 0.7,
        ...t.shadow1,
      })}
    >
      {!live && (
        <View
          style={{
            position: 'absolute',
            top: 8,
            end: 8,
            backgroundColor: t.bgSunken,
            borderRadius: t.radius.pill,
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
    </Wrapper>
  );
}
