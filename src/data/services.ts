import {
  Plane,
  Building2,
  Globe,
  ArrowRight,
  Car,
  Plus,
  Home,
  Bookmark,
  Ticket,
  User,
  LucideIcon,
} from 'lucide-react-native';

// User-visible service copy lives in i18n (serviceNames.* / serviceVerbs.* /
// serviceHints.* keyed by id); `label` stays as the internal English name.
export type Service = {
  id: 'flights' | 'hotels' | 'esim' | 'transfers' | 'cars';
  label: string;
  verb: string;
  Icon: LucideIcon;
  color: string;
  tint: string;
  /** Whether the service is actually shippable. Non-live services are badged
   *  "Soon" and lead to honest coming-soon placeholders (UX-4). */
  live: boolean;
};

export const SERVICES: Service[] = [
  { id: 'flights',   label: 'Flights',    verb: 'Find flights',           Icon: Plane,       color: '#1967D2', tint: 'rgba(25,103,210,0.10)',  live: false },
  { id: 'hotels',    label: 'Hotels',     verb: 'Find a place to stay',   Icon: Building2,   color: '#7C3AED', tint: 'rgba(124,58,237,0.10)',  live: false },
  { id: 'esim',      label: 'eSIM',       verb: 'Stay connected',         Icon: Globe,       color: '#10B981', tint: 'rgba(16,185,129,0.12)',  live: true },
  { id: 'transfers', label: 'Transfers',  verb: 'Airport & city transfers', Icon: ArrowRight, color: '#F59E0B', tint: 'rgba(245,158,11,0.12)',  live: false },
  { id: 'cars',      label: 'Car Rental', verb: 'Rent a car',             Icon: Car,         color: '#DC2626', tint: 'rgba(220,38,38,0.10)',   live: false },
];

export const SERVICE_SLOT = {
  id: 'more' as const,
  label: 'More soon',
  verb: 'Coming soon',
  Icon: Plus,
  color: '#9AA0AB',
  tint: 'transparent',
  placeholder: true,
};

export type NavItem = {
  key: 'home' | 'services' | 'bookings' | 'profile';
  label: string;
  Icon: LucideIcon;
  route: string;
};

export const NAV: NavItem[] = [
  { key: 'home',     label: 'Home',     Icon: Home,     route: '/(tabs)' },
  { key: 'services', label: 'Services', Icon: Bookmark, route: '/(tabs)/services' },
  { key: 'bookings', label: 'Bookings', Icon: Ticket,   route: '/(tabs)/bookings' },
  { key: 'profile',  label: 'Profile',  Icon: User,     route: '/(tabs)/profile' },
];

// Where a service entry point should navigate. eSIM has its own store
// (countries/regions/bundles); the rest use the search flow.
export function serviceRoute(id: Service['id'] | string): string {
  if (id === 'esim') return '/esim-store';
  return `/search/${id}`;
}
