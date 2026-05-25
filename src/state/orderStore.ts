import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CurrencyCode } from '@/data/currency';

export type OrderLine = { label: string; value: string };

export type Order = {
  id: string;
  date: string; // ISO
  kind: 'esim' | 'flight' | 'hotel' | 'transfer' | 'car';
  title: string;
  subtitle: string;
  iso?: string; // for a flag
  amountUsd: number;
  currencyCode: CurrencyCode;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'refunded';
  lines: OrderLine[];
};

type OrderState = {
  orders: Order[];
  hydrated: boolean;
  add: (o: Omit<Order, 'id' | 'date' | 'status'> & { status?: Order['status'] }) => Order;
  hydrate: () => Promise<void>;
};

const KEY = 'tulip.orders';

// Demo order so the order-history → detail flow is populated out of the box.
const DEMO_ORDER: Order = {
  id: 'ord_demo',
  date: '2026-05-20T10:30:00.000Z',
  kind: 'esim',
  title: 'Japan eSIM',
  subtitle: '5 GB · 30 days',
  iso: 'JP',
  amountUsd: 17,
  currencyCode: 'USD',
  paymentMethod: 'FIB',
  status: 'paid',
  lines: [
    { label: 'Destination', value: 'Japan' },
    { label: 'Plan', value: '5 GB · 30 days' },
    { label: 'Type', value: 'Fixed data' },
  ],
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [DEMO_ORDER],
  hydrated: false,
  add: (o) => {
    const order: Order = {
      ...o,
      id: 'ord_' + Date.now(),
      date: new Date().toISOString(),
      status: o.status ?? 'paid',
    };
    const orders = [order, ...get().orders];
    set({ orders });
    AsyncStorage.setItem(KEY, JSON.stringify(orders)).catch(() => {});
    return order;
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ orders: JSON.parse(raw) });
    } catch {}
    set({ hydrated: true });
  },
}));
