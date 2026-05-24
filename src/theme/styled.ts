import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';
import type { Theme } from './tokens';
import { useMemo } from 'react';

type NamedStyles<T> = { [P in keyof T]: any };

export function useStyles<T extends NamedStyles<T>>(factory: (t: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme, factory]);
}

export { useTheme };
