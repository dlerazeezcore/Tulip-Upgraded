// THIN UI — wiring lives in useTulipSplash.ts.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { light } from '@/theme/tokens';
import { TulipLogo } from './TulipLogo';
import { useTulipSplash } from './useTulipSplash';

/**
 * The app launch screen — Claude Design canvas "Tulip Booking splash screens",
 * artboard 1a "Deep blue — brand default". Theme-independent by design: the
 * brand gradient is the same in light and dark, like the hero surfaces.
 */
export function TulipSplash({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { appName, tagline, gradient, showText, markStyle, wordStyle, tagStyle, barStyle } =
    useTulipSplash(fontsLoaded);

  return (
    <View style={s.root}>
      {/* 160° brand gradient: blue500 → blue600 (54%) → blue700 */}
      <LinearGradient
        colors={gradient}
        locations={[0, 0.54, 1]}
        // 160° in CSS terms: the x-delta over a y-delta of 1 is tan(180−160).
        start={{ x: 0.318, y: 0 }}
        end={{ x: 0.682, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Bloom behind the mark */}
      {/* width/height are required — react-native-svg falls back to the SVG
          default 300×150 when they are left to the style alone. */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="bloom" cx="50%" cy="18%" rx="110%" ry="70%">
            <Stop offset="0" stopColor={light.onHero.fg} stopOpacity={0.22} />
            <Stop offset="0.62" stopColor={light.onHero.fg} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bloom)" />
      </Svg>

      {/* Soft light spilling in from the bottom-left corner */}
      <Svg width={440} height={440} style={s.glow} pointerEvents="none">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={light.onHero.fg} stopOpacity={0.16} />
            <Stop offset="0.7" stopColor={light.onHero.fg} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={220} cy={220} r={220} fill="url(#glow)" />
      </Svg>

      <View style={s.stage}>
        {/* 96×110 is the mark's ink box within the 206px logo square */}
        <Animated.View style={[s.markBox, markStyle]}>
          <View style={s.markInk}>
            <TulipLogo size={206} color={light.onHero.fg} />
          </View>
        </Animated.View>

        {showText ? (
          <View style={s.text}>
            <Animated.Text style={[s.wordmark, wordStyle]}>{appName}</Animated.Text>
            <Animated.Text style={[s.tagline, tagStyle]} numberOfLines={1}>
              {tagline}
            </Animated.Text>
          </View>
        ) : null}
      </View>

      <View style={s.footer}>
        <View style={s.track}>
          <Animated.View style={[s.fill, barStyle]} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: light.brand.blue500, overflow: 'hidden' },
  glow: { position: 'absolute', left: -110, bottom: -140 },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: light.space.s7,
    paddingBottom: light.space.s9,
  },
  // The mark's ink box; the 206px logo square is anchored so its ink lands
  // exactly here (bbox in the 1200 viewBox is x 343→873, y 232→853).
  markBox: { width: 96, height: 110 },
  markInk: { position: 'absolute', left: -57, top: -39 },
  text: { alignItems: 'center', gap: light.space.s4 },
  wordmark: {
    fontFamily: light.font.display,
    fontSize: 36,
    lineHeight: 36,
    letterSpacing: -0.9,
    color: light.onHero.fg,
  },
  tagline: {
    fontFamily: light.font.bodyMedium,
    fontSize: 11.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: light.onHero.fgMuted,
  },
  footer: { alignItems: 'center', paddingBottom: light.space.s7 },
  track: {
    width: 132,
    height: 3,
    borderRadius: light.radius.pill,
    backgroundColor: light.onHero.chip,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
    borderRadius: light.radius.pill,
    backgroundColor: light.onHero.fg,
    transformOrigin: 'left center',
  },
});
