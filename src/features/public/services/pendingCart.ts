// A guest's in-progress event order, stashed when we bounce them through
// sign in / sign up so their table/ticket selection survives the round trip
// and is pre-restored on the event page when they come back authenticated.
export interface CartItem {
  key: string; // unique per sellable: `${kind}:${refId}`
  kind: 'Ticket' | 'Table';
  refId: string;
  label: string;
  seats: number;
  subtotal: number;
  fee: number;
}

const keyFor = (eventsId: string) => `pendingCart:${eventsId}`;

export function savePendingCart(eventsId: string, cart: CartItem[]): void {
  try {
    sessionStorage.setItem(keyFor(eventsId), JSON.stringify(cart));
  } catch {
    // non-fatal
  }
}

// Reads and clears the stashed cart for an event. Returns [] if none/invalid.
export function takePendingCart(eventsId: string): CartItem[] {
  try {
    const raw = sessionStorage.getItem(keyFor(eventsId));
    if (!raw) return [];
    sessionStorage.removeItem(keyFor(eventsId));
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function clearPendingCart(eventsId: string): void {
  try {
    sessionStorage.removeItem(keyFor(eventsId));
  } catch {
    // non-fatal
  }
}
