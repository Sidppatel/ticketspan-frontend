import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAppSettingsStore } from '@/shared/lib/appSettingsStore';

const getActiveHoldSeconds = (): number => useAppSettingsStore.getState().bookingHoldSeconds;

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
  addedAt: number;
  expiresAt: number;
  holdSeconds?: number;
}

interface CartState {
  items: UniversalCartItem[];
  isOpen: boolean;

  addItem: (item: Omit<UniversalCartItem, 'id' | 'addedAt' | 'expiresAt'> & { addedAt?: number; expiresAt?: number; holdSeconds?: number }) => void;
  updateQuantity: (id: string, seats: number) => void;
  reclaimItem: (id: string, newHoldSeconds?: number) => void;
  reclaimAllExpired: (newHoldSeconds?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  clearEvent: (eventId: string) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;

  totalItemCount: () => number;
  subtotalCents: () => number;
  groupedByEvent: () => Record<string, UniversalCartItem[]>;
  isItemExpired: (item: UniversalCartItem) => boolean;
  hasExpiredItems: () => boolean;
}

export const isCartItemExpired = (item: UniversalCartItem): boolean => {
  if (!item.expiresAt) return false;
  return Date.now() >= item.expiresAt;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const id = `${item.eventId}:${item.kind}:${item.refId}`;
        const holdSec = item.holdSeconds ?? getActiveHoldSeconds();
        const now = Date.now();
        const addedAt = item.addedAt ?? now;
        const expiresAt = item.expiresAt ?? (now + holdSec * 1000);

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === id);
          if (existingIndex > -1) {
            const updated = [...state.items];
            const current = updated[existingIndex];
            updated[existingIndex] = {
              ...current,
              seats: item.kind === 'Table' ? item.seats : current.seats + item.seats,
              addedAt: now,
              expiresAt: now + (current.holdSeconds ?? holdSec) * 1000,
            };
            return { items: updated };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                id,
                addedAt,
                expiresAt,
                holdSeconds: holdSec,
              },
            ],
          };
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

      reclaimItem: (id, newHoldSeconds) => {
        const now = Date.now();
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id !== id) return i;
            const holdSec = newHoldSeconds ?? i.holdSeconds ?? getActiveHoldSeconds();
            return {
              ...i,
              addedAt: now,
              expiresAt: now + holdSec * 1000,
              holdSeconds: holdSec,
            };
          }),
        }));
      },

      reclaimAllExpired: (newHoldSeconds) => {
        const now = Date.now();
        set((state) => ({
          items: state.items.map((i) => {
            if (i.expiresAt && now < i.expiresAt) return i;
            const holdSec = newHoldSeconds ?? i.holdSeconds ?? getActiveHoldSeconds();
            return {
              ...i,
              addedAt: now,
              expiresAt: now + holdSec * 1000,
              holdSeconds: holdSec,
            };
          }),
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

      isItemExpired: (item) => isCartItemExpired(item),

      hasExpiredItems: () => {
        return get().items.some((i) => isCartItemExpired(i));
      },
    }),
    {
      name: 'ticketspan_universal_cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
