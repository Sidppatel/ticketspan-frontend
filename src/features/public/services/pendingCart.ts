// A guest's in-progress event order, stashed when we bounce them through
// sign in / sign up so their table/ticket selection survives the round trip
// and is pre-restored on the event page when they come back authenticated.
export interface CartItem {
  key: string; // unique per sellable: `${kind}:${refId}`
  kind: 'Ticket' | 'Table';
  refId: string;
  label: string;
  seats: number;
}

const keyFor = (eventsId: string) => `pendingCart:${eventsId}`;

export function savePendingCart(eventsId: string, cart: CartItem[]): void {
  try {
    localStorage.setItem(keyFor(eventsId), JSON.stringify(cart));
  } catch {
    // non-fatal
  }
}

// Reads the stashed cart for an event. Returns [] if none/invalid.
export function takePendingCart(eventsId: string): CartItem[] {
  try {
    const raw = localStorage.getItem(keyFor(eventsId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function clearPendingCart(eventsId: string): void {
  try {
    localStorage.removeItem(keyFor(eventsId));
  } catch {
    // non-fatal
  }
}

export function clearAllPendingCarts(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pendingCart:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // non-fatal
  }
}
