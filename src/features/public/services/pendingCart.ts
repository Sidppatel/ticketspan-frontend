export interface CartItem {
  key: string;
  kind: 'Ticket' | 'Table';
  refId: string;
  label: string;
  seats: number;
}

interface StoredCart {
  items: CartItem[];
  expiresAt: number;
}

export const DEFAULT_HOLD_SECONDS = 600;

const keyFor = (eventsId: string) => `pendingCart:${eventsId}`;

export function savePendingCart(
  eventsId: string,
  cart: CartItem[],
  holdSeconds: number = DEFAULT_HOLD_SECONDS,
): void {
  try {
    if (cart.length === 0) {
      localStorage.removeItem(keyFor(eventsId));
      return;
    }
    const stored: StoredCart = { items: cart, expiresAt: Date.now() + holdSeconds * 1000 };
    localStorage.setItem(keyFor(eventsId), JSON.stringify(stored));
  } catch {
    return;
  }
}

export function takePendingCart(eventsId: string): CartItem[] {
  try {
    const raw = localStorage.getItem(keyFor(eventsId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCart;
    if (!Array.isArray(parsed.items) || typeof parsed.expiresAt !== 'number') {
      localStorage.removeItem(keyFor(eventsId));
      return [];
    }
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(keyFor(eventsId));
      return [];
    }
    return parsed.items;
  } catch {
    return [];
  }
}

export function clearPendingCart(eventsId: string): void {
  try {
    localStorage.removeItem(keyFor(eventsId));
  } catch {
    return;
  }
}

export function clearOtherPendingCarts(eventsId: string): void {
  clearMatchingCarts((key) => key !== keyFor(eventsId));
}

export function clearAllPendingCarts(): void {
  clearMatchingCarts(() => true);
}

function clearMatchingCarts(shouldClear: (key: string) => boolean): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pendingCart:') && shouldClear(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    return;
  }
}
