// Shared bottom-sheet chrome — the canonical slide-up Modal used by pick-lists
// and detail sheets: scrim (press to close) + rounded-top container with the
// sheet radius (`radius.lg`, matching CenteredModal/FibPaymentSheet), padding
// 20 and safe-area bottom inset.
// Presentational only (no wiring hook needed): visibility and dismissal stay
// in each screen's hook and arrive via `visible` / `onClose`.
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, type DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';

export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeight,
  gap,
  avoidKeyboard,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional cap on the sheet height (e.g. '76%'). */
  maxHeight?: DimensionValue;
  /** Optional vertical gap between the sheet's direct children. */
  gap?: number;
  /** Lift the sheet above the soft keyboard — for sheets with text inputs. */
  avoidKeyboard?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const body = (
    <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'flex-end' }}>
      {/* Inner Pressable swallows taps so touching the sheet doesn't close it. */}
      <Pressable
        style={{
          backgroundColor: t.bgElev,
          borderTopLeftRadius: t.radius.lg,
          borderTopRightRadius: t.radius.lg,
          padding: 20,
          paddingBottom: 20 + insets.bottom,
          ...(maxHeight != null ? { maxHeight } : null),
          ...(gap != null ? { gap } : null),
        }}
      >
        {children}
      </Pressable>
    </Pressable>
  );
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {avoidKeyboard ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </Modal>
  );
}
