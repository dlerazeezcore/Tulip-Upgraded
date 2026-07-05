import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { DirectionalChevron } from './DirectionalChevron';
import { useTranslation } from 'react-i18next';
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
  const { t: tr } = useTranslation();
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
                accessibilityRole="button"
                accessibilityLabel={tr('a11y.back')}
                hitSlop={8}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: t.onHero.chip,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <DirectionalChevron direction="back" size={20} color={t.onPrimary} />
              </Pressable>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: t.onHero.badge,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TulipLogo size={26} color={t.primary} />
              </View>
              <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.onPrimary }}>
                {tr('common.appName')}
              </Text>
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 28, color: t.onPrimary, letterSpacing: -0.6 }}>
              {title}
            </Text>
            {subtitle && (
              <Text style={{ fontSize: 13, color: t.onPrimary, opacity: 0.9, marginTop: 4 }}>{subtitle}</Text>
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
  onFocus,
  onBlur,
  ...rest
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  // Web-only focus affordance (primary border). Mobile has none — the flag is
  // gated to web so native renders byte-for-byte unchanged.
  const showFocus = Platform.OS === 'web' && focused;
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={t.fgFaint}
        {...rest}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        style={{
          backgroundColor: t.bgElev,
          borderColor: showFocus ? t.primary : t.border,
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

/** Password input with a show/hide eye toggle. */
export function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  // Web-only focus affordance; mobile unchanged (flag gated to web).
  const showFocus = Platform.OS === 'web' && focused;
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: t.bgElev,
          borderColor: showFocus ? t.primary : t.border,
          borderWidth: 1,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.fgFaint}
          secureTextEntry={!show}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: t.fg, fontFamily: t.font.bodyMedium }}
        />
        <Pressable
          onPress={() => setShow((s) => !s)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={show ? tr('a11y.hidePassword') : tr('a11y.showPassword')}
          style={{ paddingHorizontal: 14, paddingVertical: 14 }}
        >
          {show ? <EyeOff size={18} color={t.fgMuted} /> : <Eye size={18} color={t.fgMuted} />}
        </Pressable>
      </View>
    </View>
  );
}
