// Screen-level safe-area wrapper — use this instead of the native SafeAreaView
// from react-native-safe-area-context for whole-screen containers.
//
// Why: under the New Architecture the native SafeAreaView's insets start at
// {0,0,0,0} and are pushed asynchronously after the Android view attaches, so
// every pushed screen's first frames render with zero top padding (content
// under the status bar) and then visibly jump down once the real inset lands.
// useSafeAreaInsets() reads the root provider's already-resolved context value,
// so the padding is part of the screen's FIRST commit — no second layout.
// (Safe to revert to SafeAreaView after the Expo SDK 52+ / safe-area-context
// 5.x upgrade, which computes insets synchronously on Fabric.)
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SafeEdge = 'top' | 'bottom' | 'left' | 'right';

export function ScreenSafeArea({
  edges = ['top'],
  style,
  children,
}: {
  /** Which window edges to pad (mirrors SafeAreaView's `edges`). */
  edges?: SafeEdge[];
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {};
  // Physical (not logical) padding on purpose: insets are physical.
  if (edges.includes('top')) pad.paddingTop = insets.top;
  if (edges.includes('bottom')) pad.paddingBottom = insets.bottom;
  if (edges.includes('left')) pad.paddingLeft = insets.left;
  if (edges.includes('right')) pad.paddingRight = insets.right;
  return <View style={[style, pad]}>{children}</View>;
}
