import React, { createContext, useContext, useMemo } from 'react';
import { useThemeStore } from '@/state/themeStore';
import { light, dark, Theme } from './tokens';

const ThemeCtx = createContext<Theme>(light);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const theme = useMemo(() => (mode === 'dark' ? dark : light), [mode]);
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
