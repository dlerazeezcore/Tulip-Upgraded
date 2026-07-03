// Thin UI for the in-app "update available" prompt.
//
// All logic (status, locale-aware text, store URL, AppState listener) lives in
// useUpdateAvailableModal. This file only renders.
import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useUpdateAvailableModal } from './useUpdateAvailableModal';

export function UpdateAvailableModal() {
  const t = useTheme();
  const vm = useUpdateAvailableModal();

  return (
    <Modal
      visible={vm.visible}
      transparent
      animationType="fade"
      onRequestClose={vm.canDismiss ? vm.onDismiss : undefined}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: t.scrim,
          padding: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: t.bgElev,
            borderRadius: t.radius.lg,
            padding: 22,
            gap: 12,
            ...t.shadow2,
          }}
        >
          <Text
            style={{
              fontFamily: t.font.display,
              fontSize: 22,
              fontWeight: '700',
              color: t.fg,
              letterSpacing: -0.4,
            }}
          >
            {vm.title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: t.fgMuted,
              fontFamily: t.font.body,
              lineHeight: 20,
            }}
          >
            {vm.body}
          </Text>
          {vm.notes ? (
            <Text
              style={{
                fontSize: 13,
                color: t.fgFaint,
                fontFamily: t.font.body,
                lineHeight: 18,
                marginTop: 2,
              }}
            >
              {vm.notes}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {vm.canDismiss ? (
              <Pressable
                onPress={vm.onDismiss}
                style={({ pressed }) => ({
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: t.border,
                  borderRadius: t.radius.pill,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: t.fg, fontWeight: '600', fontFamily: t.font.displayMedium }}>
                  {vm.laterLabel}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={vm.onUpdate}
              disabled={!vm.storeUrl}
              style={({ pressed }) => ({
                flex: vm.canDismiss ? 1 : 1,
                backgroundColor: t.primary,
                borderRadius: t.radius.pill,
                paddingVertical: 12,
                alignItems: 'center',
                opacity: pressed || !vm.storeUrl ? 0.85 : 1,
                ...t.shadowGlow,
              })}
            >
              <Text style={{ color: t.onPrimary, fontWeight: '700', fontFamily: t.font.displayMedium }}>
                {vm.updateLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
