export type TripBooking = {
  svc: 'flights' | 'hotels' | 'esim' | 'transfers' | 'cars';
  title: string;
  sub: string;
  status: 'Confirmed' | 'Ready' | 'Pending';
};

export type Trip = {
  id: string;
  name: string;
  dates: string;
  countdown: string;
  city: string;
  heroColor: string;
  heroPhoto: string;
  bookings: TripBooking[];
};

const photo = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

export const TRIPS: Trip[] = [
  {
    id: 'london-summer',
    name: 'London · Summer',
    dates: 'Jun 9 – Jun 22',
    countdown: 'in 18 days',
    city: 'London, UK',
    heroColor: '#1967D2',
    heroPhoto: photo('photo-1513635269975-59663e0ac1ad'),
    bookings: [
      { svc: 'flights',   title: 'AA 100 · JFK → LHR',  sub: 'Jun 9 · 21:35',          status: 'Confirmed' },
      { svc: 'hotels',    title: 'The Connaught',        sub: 'Mayfair · 13 nights',    status: 'Confirmed' },
      { svc: 'esim',      title: 'UK 5GB / 14 days',     sub: 'Activates on arrival',   status: 'Ready' },
      { svc: 'transfers', title: 'LHR → Mayfair',        sub: 'Mercedes E-Class · Jun 9', status: 'Confirmed' },
    ],
  },
  {
    id: 'tokyo-spring',
    name: 'Tokyo · Cherry blossom',
    dates: 'Apr 4 – Apr 12',
    countdown: 'completed',
    city: 'Tokyo, JP',
    heroColor: '#DC2626',
    heroPhoto: photo('photo-1522383225653-ed111181a951'),
    bookings: [
      { svc: 'flights', title: 'JL 5 · JFK → HND',     sub: 'Apr 4 · 13:25',       status: 'Confirmed' },
      { svc: 'hotels',  title: 'Park Hyatt Tokyo',     sub: 'Shinjuku · 8 nights', status: 'Confirmed' },
      { svc: 'esim',    title: 'Japan 5GB / 10 days',  sub: 'Activated',           status: 'Confirmed' },
    ],
  },
];

export const ACTIVE_TRIP = TRIPS[0];
