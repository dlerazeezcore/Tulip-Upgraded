// Standalone bookings per service — independent of any trip.
// A customer can book a hotel-only or flight-only with no trip wrapper.

export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export type StayBooking = {
  id: string;
  hotel: string;
  city: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  confirmation: string;
  status: BookingStatus;
  photo: string;
};

export type FlightBooking = {
  id: string;
  airlineCode: string;
  color: string;
  number: string;
  from: string;
  to: string;
  date: string;
  depart: string;
  arrive: string;
  pnr: string;
  status: BookingStatus;
};

export type TransferBooking = {
  id: string;
  from: string;
  to: string;
  vehicle: string;
  date: string;
  time: string;
  confirmation: string;
  status: BookingStatus;
};

export type CarBooking = {
  id: string;
  model: string;
  supplier: string;
  pickUp: string;
  dropOff: string;
  location: string;
  confirmation: string;
  status: BookingStatus;
};

const photo = (id: string, w = 400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const MY_STAYS: StayBooking[] = [
  {
    id: 'stay-connaught',
    hotel: 'The Connaught',
    city: 'Mayfair, London',
    checkIn: 'Jun 9',
    checkOut: 'Jun 22',
    nights: 13,
    guests: 2,
    confirmation: 'TLP-H2K9X',
    status: 'upcoming',
    photo: photo('photo-1566073771259-6a8506099945'),
  },
  {
    id: 'stay-standard',
    hotel: 'The Standard',
    city: "King's Cross, London",
    checkIn: 'May 2',
    checkOut: 'May 5',
    nights: 3,
    guests: 1,
    confirmation: 'TLP-S4M1Q',
    status: 'completed',
    photo: photo('photo-1564501049412-61c2a3083791'),
  },
];

export const MY_FLIGHTS: FlightBooking[] = [
  {
    id: 'fl-aa100',
    airlineCode: 'AA',
    color: '#0078D2',
    number: 'AA 100',
    from: 'JFK',
    to: 'LHR',
    date: 'Mon, Jun 9',
    depart: '21:35',
    arrive: '09:30+1',
    pnr: 'XQ7P2L',
    status: 'upcoming',
  },
  {
    id: 'fl-ba175',
    airlineCode: 'BA',
    color: '#075AAA',
    number: 'BA 175',
    from: 'LHR',
    to: 'JFK',
    date: 'Sun, Jun 22',
    depart: '14:20',
    arrive: '17:40',
    pnr: 'XQ7P2L',
    status: 'upcoming',
  },
];

export const MY_TRANSFERS: TransferBooking[] = [
  {
    id: 'tr-lhr',
    from: 'Heathrow (LHR)',
    to: 'Mayfair, London',
    vehicle: 'Mercedes E-Class',
    date: 'Jun 9',
    time: '10:15',
    confirmation: 'TLP-T8R3D',
    status: 'upcoming',
  },
];

export const MY_CARS: CarBooking[] = [
  {
    id: 'car-1',
    model: 'BMW 3 Series',
    supplier: 'Hertz',
    pickUp: 'Jun 14',
    dropOff: 'Jun 18',
    location: 'London City',
    confirmation: 'TLP-C1V7B',
    status: 'upcoming',
  },
];
