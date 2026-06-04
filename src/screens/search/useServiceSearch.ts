import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SERVICES, Service } from '@/data/services';
import { useSearchStore } from '@/state/searchStore';

export function useServiceSearch() {
  const { service } = useLocalSearchParams<{ service: string }>();
  const router = useRouter();
  const {
    activeService,
    setActive,
    from,
    to,
    setFrom,
    setTo,
    swap,
    departDate,
    returnDate,
    travelers,
    setTravelers,
    rooms,
    setRooms,
    tripType,
    setTripType,
  } = useSearchStore();

  // The ROUTE PARAM is the source of truth for which service this screen
  // shows. Previously we rendered from the global store, which could be stale
  // when Expo Router reused this dynamic [service] screen — so opening Hotels
  // (or any service) from the Services tab showed the Flights form. Deriving
  // `svc` from the param fixes that regardless of store/effect timing.
  const routeServiceId = SERVICES.some((s) => s.id === service)
    ? (service as Service['id'])
    : null;
  const svc = SERVICES.find((s) => s.id === (routeServiceId ?? activeService)) ?? SERVICES[0];

  // Keep the store in sync so MultiServiceTabs highlights the right tab.
  useEffect(() => {
    if (routeServiceId && routeServiceId !== activeService) {
      setActive(routeServiceId);
    }
  }, [routeServiceId, activeService, setActive]);

  // Switching tabs updates the URL param so the screen re-derives `svc`
  // reliably (esim jumps to its dedicated store).
  const onSelectService = (id: Service['id']) => {
    setActive(id);
    if (id === 'esim') {
      router.replace('/esim-store');
      return;
    }
    router.setParams({ service: id });
  };

  const onSearch = () => {
    if (svc.id === 'esim') router.replace('/esim-store');
    else if (svc.id === 'hotels') router.push('/results/hotels');
    else if (svc.id === 'flights') router.push('/results/flights');
    else router.push('/results/flights'); // transfers/cars demo → flights
  };

  return {
    svc,
    from,
    to,
    setFrom,
    setTo,
    swap,
    departDate,
    returnDate,
    tripType,
    setTripType,
    travelers,
    incTravelers: () => setTravelers(travelers + 1),
    decTravelers: () => setTravelers(travelers - 1),
    rooms,
    incRooms: () => setRooms(rooms + 1),
    decRooms: () => setRooms(rooms - 1),
    onSelectService,
    onSearch,
    goBack: () => router.back(),
  };
}
