export const USER = {
  firstName: 'Jane',
  lastName: 'Olsen',
  initials: 'JO',
  email: 'jane.olsen@example.com',
  tier: 'TULIP+' as const,
  memberSince: 2023,
  travelers: [
    { id: 't1', name: 'Jane Olsen',   relation: 'Primary',  dob: '1989-03-12' },
    { id: 't2', name: 'Marcus Olsen', relation: 'Spouse',   dob: '1987-09-03' },
    { id: 't3', name: 'Liam Olsen',   relation: 'Child',    dob: '2019-11-21' },
  ],
  payment: [
    { id: 'p1', brand: 'Visa',       last4: '4321', exp: '06/28', primary: true  },
    { id: 'p2', brand: 'Mastercard', last4: '8867', exp: '11/26', primary: false },
  ],
};
