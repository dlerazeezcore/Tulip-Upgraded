// Shared centered dialog for admin editors (pricing, users, currency, featured).
// Replaces the old bottom-sheet (`justifyContent:'flex-end'`) editors so popups
// open in the CENTER of the screen. Keyboard-safe: the card is height-capped and
// scrollable and lifts above the keyboard, so text inputs stay visible.
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  /** Card max width (px). Default 560. */
  maxWidth?: number;
  /** Tap on the dimmed backdrop closes the dialog. Default true — set false for
   *  forms with unsaved input so an accidental tap can't discard it. */
  dismissOnBackdrop?: boolean;
};

export function CenteredModal({
  visible,
  onRequestClose,
  children,
  maxWidth = 560,
  dismissOnBackdrop = true,
}: Props) {
  const t = useTheme();
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      {/* Android: 'height' lifts the centred card above the soft keyboard.
          RN Modals are a separate window that adjustResize doesn't reliably
          resize, so the KeyboardAvoidingView must do the work here. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable
          onPress={dismissOnBackdrop ? onRequestClose : undefined}
          style={{ flex: 1, backgroundColor: t.scrim, alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          {/* Inner Pressable swallows taps so interacting with the card never
              closes the dialog through the backdrop handler. */}
          <Pressable
            onPress={() => {}}
            style={{
              width: '100%',
              maxWidth,
              maxHeight: height * 0.85,
              backgroundColor: t.bgElev,
              borderRadius: t.radius.lg,
              ...t.shadow2,
            }}
          >
            <ScrollView
              contentContainerStyle={{ padding: 20, gap: 14 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
