export type Hotel = {
  id: string;
  name: string;
  area: string;
  price: number;
  rating: number;
  reviews: number;
  stars: number;
  amenities: ('wifi' | 'pool' | 'gym' | 'breakfast')[];
  color: string;
  photo: string;
};

// Unsplash photos — auto-served at the requested width with DPR awareness.
const photo = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HOTELS: Hotel[] = [
  { id: 'connaught',       name: 'The Connaught',         area: 'Mayfair · London',      price: 720, rating: 4.9, reviews: 1284, stars: 5, amenities: ['wifi', 'pool', 'gym', 'breakfast'], color: '#7C3AED', photo: photo('photo-1566073771259-6a8506099945') },
  { id: 'shoreditch',      name: 'Shoreditch House',      area: 'Shoreditch · London',   price: 410, rating: 4.7, reviews: 892,  stars: 4, amenities: ['wifi', 'gym', 'breakfast'],         color: '#10B981', photo: photo('photo-1611892440504-42a792e24d32') },
  { id: 'hoxton-holborn',  name: 'The Hoxton, Holborn',   area: 'Holborn · London',      price: 295, rating: 4.6, reviews: 2103, stars: 4, amenities: ['wifi', 'breakfast'],                color: '#F59E0B', photo: photo('photo-1582719508461-905c673771fd') },
  { id: 'claridges',       name: "Claridge's",            area: 'Mayfair · London',      price: 880, rating: 4.9, reviews: 1567, stars: 5, amenities: ['wifi', 'pool', 'gym', 'breakfast'], color: '#DC2626', photo: photo('photo-1551882547-ff40c63fe5fa') },
  { id: 'standard-kings',  name: 'The Standard',          area: "King's Cross · London", price: 360, rating: 4.5, reviews: 743,  stars: 4, amenities: ['wifi', 'gym'],                      color: '#1967D2', photo: photo('photo-1564501049412-61c2a3083791') },
  { id: 'rosewood',        name: 'Rosewood London',       area: 'Holborn · London',      price: 950, rating: 4.8, reviews: 1102, stars: 5, amenities: ['wifi', 'pool', 'gym', 'breakfast'], color: '#0EA5E9', photo: photo('photo-1542314831-068cd1dbfeeb') },
];
