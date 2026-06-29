// 1:1 port of tulip-v2/tokens.css → JS theme objects.

const shared = {
  brand: {
    blue50: '#EFF5FE',
    blue100: '#DCE9FC',
    blue200: '#B6D0F8',
    blue300: '#7CAEF1',
    blue400: '#3B82F6',
    blue500: '#1967D2',
    blue600: '#1557B0',
    blue700: '#114A99',
    blue800: '#0E3D7E',
    blue900: '#0B2E5F',
  },
  radius: { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 },
  space: { s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s7: 32, s8: 40, s9: 48, s10: 64 },
  font: {
    display: 'Outfit_700Bold',
    displayMedium: 'Outfit_600SemiBold',
    body: 'PlusJakartaSans_400Regular',
    bodyMedium: 'PlusJakartaSans_500Medium',
    bodyBold: 'PlusJakartaSans_700Bold',
  },
  ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  // Decorative, theme-independent accent palette + gradient pairs. Vivid by
  // design (category tiles, region cards); intentionally the same in light/dark.
  accent: {
    blue: '#1967D2',
    sky: '#0EA5E9',
    amber: '#F59E0B',
    purple: '#7C3AED',
    emerald: '#10B981',
    pink: '#EC4899',
    red: '#EF4444',
    teal: '#14B8A6',
  },
  gradients: [
    ['#1967D2', '#0B4FB0'],
    ['#10B981', '#047857'],
    ['#7C3AED', '#5B21B6'],
    ['#F59E0B', '#B45309'],
    ['#EC4899', '#9D174D'],
    ['#0EA5E9', '#0369A1'],
    ['#EF4444', '#991B1B'],
    ['#14B8A6', '#0F766E'],
  ] as [string, string][],
};

type Mode = 'light' | 'dark';

export type Theme = typeof shared & {
  mode: Mode;
  bg: string;
  bgElev: string;
  bgElev2: string;
  bgSunken: string;
  fg: string;
  fgMuted: string;
  fgFaint: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryHover: string;
  primaryActive: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  // Semantic info-surface tokens (tinted content cards). Unlike the fixed
  // brand.blue50 these adapt to dark mode instead of glowing bright white.
  infoBg: string;
  infoFg: string;
  gradHero: readonly [string, string, string];
  shadow1: object;
  shadow2: object;
  shadow3: object;
  shadowGlow: object;
};

export const light: Theme = {
  ...shared,
  mode: 'light',
  bg: '#F9FAFB',
  bgElev: '#FFFFFF',
  bgElev2: '#FFFFFF',
  bgSunken: '#F3F4F6',
  fg: '#1F2937',
  fgMuted: '#717182',
  fgFaint: '#9AA0AB',
  border: '#ECECF0',
  borderStrong: '#D9DBE2',
  primary: '#1967D2',
  primaryHover: '#1557B0',
  primaryActive: '#114A99',
  onPrimary: '#FFFFFF',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#1967D2',
  infoBg: '#EFF5FE',
  infoFg: '#1557B0',
  gradHero: ['#1967D2', '#1557B0', '#114A99'] as const as readonly [string, string, string],
  shadow1: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  shadow2: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  shadow3: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  shadowGlow: {
    shadowColor: '#1967D2',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
};

export const dark: Theme = {
  ...shared,
  mode: 'dark',
  bg: '#0B1120',
  bgElev: '#141C2F',
  bgElev2: '#1A2236',
  bgSunken: '#0F1729',
  fg: '#F8FAFC',
  fgMuted: '#94A3B8',
  fgFaint: '#64748B',
  border: '#1E293B',
  borderStrong: '#2A3A55',
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryActive: '#1D4ED8',
  onPrimary: '#FFFFFF',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#3B82F6',
  infoBg: '#15243B',
  infoFg: '#7CAEF1',
  gradHero: ['#1E3A8A', '#1557B0', '#1967D2'] as const as readonly [string, string, string],
  shadow1: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  shadow2: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  shadow3: {
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  shadowGlow: {
    shadowColor: '#3B82F6',
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
};

export const themes = { light, dark };
