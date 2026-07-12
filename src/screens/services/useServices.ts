import type { DimensionValue } from 'react-native';
import { useIsWideWeb } from '@/lib/responsive';

// Card taps navigate via ServiceTile's own wiring (useServiceTile), so this
// hook only owns the responsive grid shape.
export function useServices() {
  const isWide = useIsWideWeb();
  const colPct: DimensionValue = isWide ? '33.333%' : '50%';

  return {
    isWide,
    colPct,
  };
}
