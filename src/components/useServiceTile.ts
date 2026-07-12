// Wiring for ServiceTile — owns navigation + search-store activation and the
// availability/placeholder derivation. THIN UI lives in ServiceTile.tsx.
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LucideIcon } from 'lucide-react-native';
import { SERVICE_SLOT, Service, serviceRoute } from '@/data/services';
import { useSearchStore } from '@/state/searchStore';

export type ServiceTileVM = {
  placeholder: boolean;
  /** UX-4: services that aren't shippable yet are badged "Soon". */
  live: boolean;
  Icon: LucideIcon;
  color: string;
  tint: string;
  name: string;
  verb: string;
  soonLabel: string;
  /** CTA pill label on the big (`size="lg"`) services-screen card. */
  openLabel: string;
  onPress: () => void;
};

export function useServiceTile(svc: Service | typeof SERVICE_SLOT): ServiceTileVM {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const setActive = useSearchStore((s) => s.setActive);
  const placeholder = !!(svc as any).placeholder;
  // UX-4: services that aren't shippable yet are badged "Soon" so the tap isn't a
  // surprise dead-end. `live` is undefined on the placeholder slot — treat as live.
  const live = (svc as any).live ?? true;

  const onPress = () => {
    // Coming-soon services are inert: no navigation to a dead-end placeholder
    // until they actually ship. The tile also renders non-pressable, this is
    // defense-in-depth.
    if (placeholder || !live) return;
    setActive(svc.id as Service['id']);
    router.push(serviceRoute(svc.id) as any);
  };

  return {
    placeholder,
    live,
    Icon: svc.Icon,
    color: svc.color,
    tint: svc.tint,
    name: placeholder ? svc.label : tr(`serviceNames.${svc.id}`),
    verb: placeholder ? tr('servicesScreen.moreComing') : tr(`serviceVerbs.${svc.id}`),
    soonLabel: tr('common.soon'),
    openLabel: tr('servicesScreen.open'),
    onPress,
  };
}
