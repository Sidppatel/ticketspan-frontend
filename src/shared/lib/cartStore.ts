import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UniversalCartItem {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate?: number;
  eventSlug?: string;
  venueName?: string;
  venueZip?: string;
  kind: 'Ticket' | 'Table';
  refId: string;
  label: string;
  unitPriceCents: number;
  seats: number;
  tenantId?: string;
}

interface CartState {
  items: UniversalCartItem[];
  isOpen: boolean;

  addItem: (item: Omit<UniversalCartItem, 'id'>) => void;
  updateQuantity: (id: string, seats: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  clearEvent: (eventId: string) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;

  totalItemCount: () => number;
  subtotalCents: () => number;
  groupedByEvent: () => Record<string, UniversalCartItem[]>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const id = `${item.eventId}:${item.kind}:${item.refId}`;
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === id);
          if (existingIndex > -1) {
            const updated = [...state.items];
            const current = updated[existingIndex];
            updated[existingIndex] = {
              ...current,
              seats: item.kind === 'Table' ? item.seats : current.seats + item.seats,
            };
            return { items: updated };
          }
          return { items: [...state.items, { ...item, id }] };
        });
      },

      updateQuantity: (id, seats) => {
        if (seats <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, seats } : i)),
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      clearCart: () => set({ items: [] }),

      clearEvent: (eventId) =>
        set((state) => ({
          items: state.items.filter((i) => i.eventId !== eventId),
        })),

      setOpen: (open) => set({ isOpen: open }),

      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItemCount: () => {
        return get().items.reduce((sum, item) => sum + (item.kind === 'Table' ? 1 : item.seats), 0);
      },

      subtotalCents: () => {
        return get().items.reduce((sum, item) => sum + item.unitPriceCents * item.seats, 0);
      },

      groupedByEvent: () => {
        const items = get().items;
        const groups: Record<string, UniversalCartItem[]> = {};
        for (const item of items) {
          if (!groups[item.eventId]) {
            groups[item.eventId] = [];
          }
          groups[item.eventId].push(item);
        }
        return groups;
      },
    }),
    {
      name: 'ticketspan_universal_cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
