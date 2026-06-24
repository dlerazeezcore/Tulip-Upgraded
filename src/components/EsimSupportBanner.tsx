// Tiny soft banner that surfaces when the OS told us this device has no eSIM
// hardware. Shown on the home screen so users aren't surprised at checkout.
// Renders nothing in 'supported' and 'unknown' states (we don't false-alarm
// on web / Expo Go / simulator where we can't tell).
import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useDeviceStore } from '@/state/deviceStore';

type Props = {
  /** Override the default copy if a screen wants a tighter / longer message. */
  message?: string;
};

export function EsimSupportBanner({ message }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const esimSupport = useDeviceStore((s) => s.esimSupport);
  if (esimSupport !== 'unsupported') return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(245,158,11,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.4)',
        alignItems: 'flex-start',
      }}
    >
      <AlertTriangle size={16} color={t.warning ?? '#F59E0B'} />
      <Text style={{ flex: 1, fontSize: 12, color: t.fg, lineHeight: 17 }}>
        {message ?? tr('checkout.bannerUnsupported')}
      </Text>
    </View>
  );
}
