import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { DirectionalChevron } from './DirectionalChevron';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useKeyboardVisible } from '@/lib/keyboard';
import { TulipLogo } from './TulipLogo';
import { ScreenSafeArea } from '@/components/ScreenSafeArea';

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
  // While the keyboard is up it can take half a small screen, so the decorative
  // half of the hero (logo lockup, subtitle, generous spacing) collapses and the
  // form keeps the room. Everything still visible stays in the same place, so it
  // reads as the header shrinking rather than the page jumping.
  const compact = useKeyboardVisible();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LinearGradient
        colors={t.gradHero as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingBottom: compact ? 12 : 28 }}
      >
        <ScreenSafeArea>
          <View style={{ paddingHorizontal: 20, paddingTop: compact ? 4 : 8 }}>
            {canGoBack && (
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel={tr('a11y.back')}
                hitSlop={8}
                style={{
                  width: compact ? 32 : 38,
                  height: compact ? 32 : 38,
                  borderRadius: compact ? 16 : 19,
                  backgroundColor: t.onHero.chip,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: compact ? 8 : 14,
                }}
              >
                <DirectionalChevron direction="back" size={compact ? 18 : 20} color={t.onPrimary} />
              </Pressable>
            )}
            {/* Branding is the first thing to go — the user knows which app they
                are in by the time they are typing into it. */}
            {!compact && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: t.radius.badge,
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
            )}
            <Text
              style={{
                fontFamily: t.font.display,
                fontWeight: '700',
                fontSize: compact ? 20 : 28,
                color: t.onPrimary,
                letterSpacing: -0.6,
              }}
            >
              {title}
            </Text>
            {/* The subtitle explains the screen; once you are typing you have read it. */}
            {subtitle && !compact && (
              <Text style={{ fontSize: 13, color: t.onPrimary, opacity: 0.9, marginTop: 4 }}>{subtitle}</Text>
            )}
          </View>
        </ScreenSafeArea>
      </LinearGradient>

      <KeyboardAvoidingView
        // Android resizes the window itself (app.json softwareKeyboardLayoutMode
        // "resize"), so adding padding on top of that would double-count the
        // keyboard and strand the submit button above it.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, marginTop: -16 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingTop: compact ? 20 : 24,
            paddingBottom: compact ? 28 : 20,
            gap: 14,
            maxWidth: 520,
            width: '100%',
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: t.bgElev,
              borderRadius: t.radius.xl,
              borderWidth: 1,
              borderColor: t.border,
              padding: compact ? 14 : 18,
              gap: compact ? 12 : 14,
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
    <View style={{ flexDirection: 'row', backgroundColor: t.bgSunken, borderRadius: t.radius.badge, padding: 4 }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: t.radius.segment,
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
          borderRadius: t.radius.md,
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
          borderRadius: t.radius.md,
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
