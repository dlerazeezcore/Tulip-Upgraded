import { create } from 'zustand';
import { getMyOrders } from '@/services/esim';
import type { OrderSummary } from '@/services/types';
import { useAuthStore } from '@/state/authStore';

type OrderState = {
  orders: OrderSummary[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  byId: (id: string | number) => OrderSummary | undefined;
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,
  loaded: false,
  error: null,
  byId: (id) => get().orders.find((o) => String(o.id) === String(id)),
  refresh: async () => {
    if (!useAuthStore.getState().isAuthed()) {
      set({ orders: [], loaded: true, error: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      const orders = await getMyOrders({ limit: 200 });
      set({ orders, loaded: true });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load orders' });
    } finally {
      set({ loading: false });
    }
  },
}));
