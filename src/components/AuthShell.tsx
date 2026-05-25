import React from 'react';
import { ScrollView, View, Text, Pressable, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { TulipLogo } from './TulipLogo';

/** Branded full-screen shell for auth screens: gradient header + card body. */
export function AuthShell({
  title,
  subtitle,
  children,
  canGoBack = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  canGoBack?: boolean;
}) {
  const t = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LinearGradient
        colors={t.gradHero as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingBottom: 28 }}
      >
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            {canGoBack && (
              <Pressable
                onPress={() => router.back()}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <ChevronLeft size={20} color="#fff" />
              </Pressable>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TulipLogo size={26} color={t.primary} />
              </View>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: '#fff' }}>
                Tulip Booking
              </Text>
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 28, color: '#fff', letterSpacing: -0.6 }}>
              {title}
            </Text>
            {subtitle && (
              <Text style={{ fontSize: 13, color: '#fff', opacity: 0.9, marginTop: 4 }}>{subtitle}</Text>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, marginTop: -16 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingTop: 24,
            gap: 14,
            maxWidth: 520,
            width: '100%',
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              backgroundColor: t.bgElev,
              borderRadius: t.radius.xl,
              borderWidth: 1,
              borderColor: t.border,
              padding: 18,
              gap: 14,
              ...t.shadow2,
            }}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Segmented toggle used across auth screens. */
export function AuthSegmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.bgSunken, borderRadius: 12, padding: 4 }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 9,
              alignItems: 'center',
              backgroundColor: on ? t.bgElev : 'transparent',
              ...(on ? t.shadow1 : {}),
            }}
          >
            <Text
              style={{
                fontFamily: t.font.displayMedium,
                fontWeight: '700',
                fontSize: 13,
                color: on ? t.fg : t.fgMuted,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Labeled text input matching the auth card style. */
export function Field({
  label,
  ...rest
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={t.fgFaint}
        {...rest}
        style={{
          backgroundColor: t.bgElev,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 15,
          color: t.fg,
          fontFamily: t.font.bodyMedium,
        }}
      />
    </View>
  );
}
