export type FareFamily = {
  name: 'Light' | 'Standard' | 'Flex' | 'Business';
  price: number;
  bag: string;
  changes: string;
  refund: 'No' | 'Fee' | 'Free';
};

export type Flight = {
  id: string;
  airline: string;
  airlineCode: 'AA' | 'BA' | 'VS' | 'DL';
  color: string;
  number: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  duration: string;
  stops: 'Nonstop' | '1 stop';
  price: number;
  fares: FareFamily[];
};

export const FLIGHTS: Flight[] = [
  {
    id: 'aa100',
    airline: 'American Airlines',
    airlineCode: 'AA',
    color: '#0078D2',
    number: 'AA 100',
    from: 'JFK',
    to: 'LHR',
    depart: '21:35',
    arrive: '09:30+1',
    duration: '6h 55m',
    stops: 'Nonstop',
    price: 612,
    fares: [
      { name: 'Light',    price: 612,  bag: 'Carry-on',      changes: 'No',  refund: 'No'   },
      { name: 'Standard', price: 798,  bag: '1 checked bag', changes: 'Fee', refund: 'No'   },
      { name: 'Flex',     price: 1180, bag: '2 checked bags',changes: 'Free',refund: 'Free' },
      { name: 'Business', price: 3450, bag: '3 checked bags',changes: 'Free',refund: 'Free' },
    ],
  },
  {
    id: 'ba178',
    airline: 'British Airways',
    airlineCode: 'BA',
    color: '#075AAA',
    number: 'BA 178',
    from: 'JFK',
    to: 'LHR',
    depart: '18:45',
    arrive: '06:55+1',
    duration: '7h 10m',
    stops: 'Nonstop',
    price: 645,
    fares: [
      { name: 'Light',    price: 645,  bag: 'Carry-on',      changes: 'No',  refund: 'No' },
      { name: 'Standard', price: 820,  bag: '1 checked bag', changes: 'Fee', refund: 'No' },
      { name: 'Flex',     price: 1210, bag: '2 checked bags',changes: 'Free',refund: 'Free' },
      { name: 'Business', price: 3690, bag: '3 checked bags',changes: 'Free',refund: 'Free' },
    ],
  },
  {
    id: 'vs4',
    airline: 'Virgin Atlantic',
    airlineCode: 'VS',
    color: '#DA0530',
    number: 'VS 4',
    from: 'JFK',
    to: 'LHR',
    depart: '20:15',
    arrive: '08:25+1',
    duration: '7h 10m',
    stops: 'Nonstop',
    price: 589,
    fares: [
      { name: 'Light',    price: 589,  bag: 'Carry-on',      changes: 'No',  refund: 'No' },
      { name: 'Standard', price: 770,  bag: '1 checked bag', changes: 'Fee', refund: 'No' },
      { name: 'Flex',     price: 1095, bag: '2 checked bags',changes: 'Free',refund: 'Free' },
      { name: 'Business', price: 3290, bag: '3 checked bags',changes: 'Free',refund: 'Free' },
    ],
  },
  {
    id: 'dl3',
    airline: 'Delta',
    airlineCode: 'DL',
    color: '#003366',
    number: 'DL 3',
    from: 'JFK',
    to: 'LHR',
    depart: '22:10',
    arrive: '10:25+1',
    duration: '7h 15m',
    stops: 'Nonstop',
    price: 624,
    fares: [
      { name: 'Light',    price: 624,  bag: 'Carry-on',      changes: 'No',  refund: 'No' },
      { name: 'Standard', price: 810,  bag: '1 checked bag', changes: 'Fee', refund: 'No' },
      { name: 'Flex',     price: 1160, bag: '2 checked bags',changes: 'Free',refund: 'Free' },
      { name: 'Business', price: 3380, bag: '3 checked bags',changes: 'Free',refund: 'Free' },
    ],
  },
];
