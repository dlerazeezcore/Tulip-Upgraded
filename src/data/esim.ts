const photo = (id: string, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const POPULAR_COUNTRIES = [
  { iso: 'JP', name: 'Japan',     from: 4.5, hue: '#ef4444', photo: photo('photo-1545569341-9eb8b30979d9') },
  { iso: 'FR', name: 'France',    from: 5.0, hue: '#3b82f6', photo: photo('photo-1502602898657-3e91760cbb34') },
  { iso: 'TH', name: 'Thailand',  from: 3.5, hue: '#10b981', photo: photo('photo-1528181304800-259b08848526') },
  { iso: 'US', name: 'USA',       from: 6.0, hue: '#6366f1', photo: photo('photo-1485871981521-5b1fd3805eee') },
  { iso: 'IT', name: 'Italy',     from: 5.5, hue: '#f59e0b', photo: photo('photo-1525874684015-58379d421a52') },
  { iso: 'ES', name: 'Spain',     from: 4.0, hue: '#dc2626', photo: photo('photo-1543783207-ec64e4d95325') },
];

export const ACTIVE_ESIM = {
  country: 'Japan',
  iso: 'JP',
  used: 2.3,
  total: 5,
  daysLeft: 8,
};
