// Mock admin data — replaced by the backend later.

export type AdminUser = {
  id: string;
  name: string;
  phone: string;
  joined: string;
  orders: number;
  tier: 'Free' | 'TULIP+';
};

export const ADMIN_USERS: AdminUser[] = [
  { id: 'u1', name: 'Jane Olsen',     phone: '+964 750 120 4567', joined: '2026-05-21', orders: 4, tier: 'TULIP+' },
  { id: 'u2', name: 'Marcus Reed',    phone: '+964 751 880 1199', joined: '2026-05-20', orders: 1, tier: 'Free' },
  { id: 'u3', name: 'Sara Haddad',    phone: '+964 770 442 3322', joined: '2026-05-18', orders: 7, tier: 'TULIP+' },
  { id: 'u4', name: 'Ali Karim',      phone: '+964 780 991 0011', joined: '2026-05-17', orders: 2, tier: 'Free' },
  { id: 'u5', name: 'Dilan Aziz',     phone: '+964 750 333 7788', joined: '2026-05-15', orders: 3, tier: 'Free' },
  { id: 'u6', name: 'Noor Salim',     phone: '+964 751 220 6655', joined: '2026-05-12', orders: 5, tier: 'TULIP+' },
];

export const PUSH_AUDIENCES = ['All users', 'TULIP+ members', 'New users (7d)', 'Has active eSIM'];
