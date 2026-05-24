import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';

const NOTES = [
  { id: 1, title: 'Check-in opens for AA 100', body: 'Online check-in opens 24h before departure on Jun 8 at 21:35.', time: '2h ago', unread: true },
  { id: 2, title: 'eSIM ready for activation', body: 'Your UK 5GB eSIM is ready. Activate on arrival at LHR.', time: '1d ago', unread: true },
  { id: 3, title: 'Hotel confirmation: The Connaught', body: 'Your reservation for Jun 9–22 is confirmed.', time: '3d ago', unread: false },
];

export default function Inbox() {
  const t = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' }}
      >
        <ScreenHeader title="Inbox" subtitle="Trip alerts and account updates" />
        <View style={{ gap: 10 }}>
          {NOTES.map((n) => (
            <View
              key={n.id}
              style={{
                padding: 14,
                borderRadius: 14,
                backgroundColor: t.bgElev,
                borderColor: t.border,
                borderWidth: 1,
                flexDirection: 'row',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: n.unread ? t.primary : t.bgSunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={16} color={n.unread ? '#fff' : t.fgMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: t.font.displayMedium, fontWeight: '700', color: t.fg, fontSize: 14 }}>
                    {n.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: t.fgFaint }}>{n.time}</Text>
                </View>
                <Text style={{ fontSize: 12, color: t.fgMuted, marginTop: 4, lineHeight: 18 }}>
                  {n.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 11, color: t.fgFaint, textAlign: 'center', marginTop: 10 }}>
          Hero-slice prototype · Inbox is a placeholder
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
