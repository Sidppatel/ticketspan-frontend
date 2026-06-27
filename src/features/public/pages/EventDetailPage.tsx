import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getEventBySlug,
  getEventLayout,
  calculatePrice,
  listEventTableTypes,
} from '@/features/public/services/publicEventService';
import { listEventTicketTypes, createMultiBooking } from '@/features/public/services/paymentService';
import {
  type CartItem,
  savePendingCart,
  takePendingCart,
  clearPendingCart,
} from '@/features/public/services/pendingCart';
import type { EventTicketType } from '@/shared/proto/bookings';
import type { Table } from '@/shared/proto/booking';
import { rpcErrorMessage } from '@/shared/session';
import { useAuth } from '@/shared/auth/useAuth';
import { setReturnTo } from '@/shared/auth/returnTo';
import { centsToUSD } from '@/shared/lib/format';
import { addCents } from '@/shared/lib/math';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const loader = useCallback(() => getEventBySlug(slug), [slug]);
  const { data: event, loading, error } = useAsync(loader);

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (error || !event) {
    return <p className="text-destructive">{error ?? 'Event not found.'}</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-foreground">{event.description}</p>
          <p className="text-sm text-muted-foreground">Category: {event.category}</p>
          <p className="text-sm text-muted-foreground">Status: {event.status}</p>
        </CardContent>
      </Card>
      <CartBookingPanel
        eventsId={event.eventsId}
        eventType={event.eventType || 'Open'}
        feesIncluded={event.feesIncluded}
      />
    </div>
  );
}

function CartBookingPanel({
  eventsId,
  eventType,
  feesIncluded,
}: {
  eventsId: string;
  eventType: string;
  feesIncluded: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const showTickets = eventType === 'Open' || eventType === 'Both';
  const showTables = eventType === 'Table' || eventType === 'Both';

  // Restore a selection stashed before bouncing a guest through login, so they
  // come back to a pre-filled order without re-picking everything.
  const [cart, setCart] = useState<CartItem[]>(() => takePendingCart(eventsId));
  const [busy, setBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const upsert = useCallback((item: CartItem) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.key !== item.key);
      return [...next, item];
    });
  }, []);
  const removeKey = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }, []);
  const inCart = useCallback((key: string) => cart.some((i) => i.key === key), [cart]);

  const subtotal = cart.reduce((s, i) => addCents(s, i.subtotal), 0);
  const fee = cart.reduce((s, i) => addCents(s, i.fee), 0);
  const total = addCents(subtotal, fee);

  async function checkout() {
    // Guest: stash the selection + where to return, then send to sign in / up.
    // They land back here with the cart pre-filled and click through.
    if (!isAuthenticated) {
      savePendingCart(eventsId, cart);
      setReturnTo(location.pathname + location.search);
      navigate('/login');
      return;
    }

    setBusy(true);
    setBookingError(null);
    try {
      const { bookingsId } = await createMultiBooking(
        eventsId,
        cart.map((i) => ({ kind: i.kind, refId: i.refId, seats: i.kind === 'Ticket' ? i.seats : 0 })),
      );
      clearPendingCart(eventsId);
      navigate(`/checkout/${bookingsId}`);
    } catch (caught) {
      setBookingError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {showTickets ? (
        <TicketTierSection eventsId={eventsId} feesIncluded={feesIncluded} cart={cart} upsert={upsert} removeKey={removeKey} />
      ) : null}
      {showTables ? (
        <TableSection eventsId={eventsId} feesIncluded={feesIncluded} inCart={inCart} upsert={upsert} removeKey={removeKey} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Your order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet. Add tickets or a table above.</p>
          ) : (
            <div className="divide-y">
              {cart.map((i) => (
                <div key={i.key} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="rounded bg-muted px-1 text-xs uppercase text-muted-foreground">{i.kind}</span>{' '}
                    <span className="font-medium">{i.label}</span>
                    <span className="text-muted-foreground"> · {i.seats} {i.seats === 1 ? 'seat' : 'seats'}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-medium">
                      {centsToUSD(feesIncluded ? addCents(i.subtotal, i.fee) : i.subtotal)}
                    </span>
                    <button className="text-destructive" onClick={() => removeKey(i.key)} type="button">
                      Remove
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 ? (
            feesIncluded ? (
              <div className="flex justify-between text-sm font-medium">
                <span>Total</span>
                <span>{centsToUSD(total)}</span>
              </div>
            ) : (
              <div className="space-y-0.5 text-sm text-foreground">
                <div className="flex justify-between"><span>Subtotal</span><span>{centsToUSD(subtotal)}</span></div>
                <div className="flex justify-between"><span>Service fee</span><span>{centsToUSD(fee)}</span></div>
                <div className="flex justify-between font-medium"><span>Total</span><span>{centsToUSD(total)}</span></div>
              </div>
            )
          ) : null}

          {bookingError ? <p className="text-sm text-destructive">{bookingError}</p> : null}
          <Button disabled={busy || cart.length === 0 || total <= 0} onClick={checkout}>
            {busy ? 'Reserving…' : 'Continue to payment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TicketTierSection({
  eventsId,
  feesIncluded,
  cart,
  upsert,
  removeKey,
}: {
  eventsId: string;
  feesIncluded: boolean;
  cart: CartItem[];
  upsert: (i: CartItem) => void;
  removeKey: (key: string) => void;
}) {
  const loader = useCallback(() => listEventTicketTypes(eventsId), [eventsId]);
  const { data: ticketTypes, loading } = useAsync(loader);

  function seatsFor(refId: string): number {
    return cart.find((i) => i.key === `Ticket:${refId}`)?.seats ?? 0;
  }
  function setSeats(tt: EventTicketType, seats: number) {
    const key = `Ticket:${tt.eventTicketTypesId}`;
    if (seats <= 0) {
      removeKey(key);
      return;
    }
    upsert({
      key,
      kind: 'Ticket',
      refId: tt.eventTicketTypesId,
      label: tt.label,
      seats,
      // eslint-disable-next-line
      subtotal: tt.priceCents * seats,
      // eslint-disable-next-line
      fee: tt.platformFeeCents * seats,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? <p className="text-sm text-muted-foreground">Loading ticket types…</p> : null}
        {!loading && (ticketTypes ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets on sale yet.</p>
        ) : null}
        {(ticketTypes ?? []).map((tt) => {
          const qty = seatsFor(tt.eventTicketTypesId);
          const max = tt.maxQuantity && tt.maxQuantity > 0 ? tt.maxQuantity : undefined;
          return (
            <div key={tt.eventTicketTypesId} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{tt.label}</span>
                {tt.description ? <span className="block text-xs text-muted-foreground">{tt.description}</span> : null}
                <span className="block text-xs text-muted-foreground">
                  {centsToUSD(feesIncluded ? addCents(tt.priceCents, tt.platformFeeCents) : tt.priceCents)} each
                  {!feesIncluded && tt.platformFeeCents > 0 ? ` + ${centsToUSD(tt.platformFeeCents)} fee` : ''}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" disabled={qty <= 0}
                  onClick={() => setSeats(tt, qty - 1)}>−</Button>
                <Input
                  type="number"
                  min={0}
                  max={max}
                  className="w-16 text-center"
                  value={qty}
                  onChange={(e) => setSeats(tt, Math.max(0, Math.min(max ?? Infinity, Number(e.target.value))))}
                />
                <Button type="button" size="sm" variant="outline" disabled={max !== undefined && qty >= max}
                  onClick={() => setSeats(tt, qty + 1)}>+</Button>
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

const OBJECT_GLYPH: Record<string, string> = { Entry: '→', Exit: '←', Stage: '▭' };
function shapeRadius(shape: string): string {
  switch (shape) {
    case 'Round':
    case 'Cocktail':
      return 'rounded-full';
    case 'Square':
      return 'rounded-none';
    default:
      return 'rounded-md';
  }
}

function TableSection({
  eventsId,
  feesIncluded,
  inCart,
  upsert,
  removeKey,
}: {
  eventsId: string;
  feesIncluded: boolean;
  inCart: (key: string) => boolean;
  upsert: (i: CartItem) => void;
  removeKey: (key: string) => void;
}) {
  const layoutLoader = useCallback(() => getEventLayout(eventsId), [eventsId]);
  const { data: layout, loading } = useAsync(layoutLoader);
  const typesLoader = useCallback(() => listEventTableTypes(eventsId), [eventsId]);
  const { data: types } = useAsync(typesLoader);
  const typeById = useMemo(() => new Map((types ?? []).map((t) => [t.eventTablesId, t])), [types]);

  const [pending, setPending] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Pixel canvas extent = furthest item edge + padding.
  const canvas = useMemo(() => {
    let w = 0;
    let h = 0;
    for (const t of layout?.tables ?? []) {
      w = Math.max(w, t.posX + (t.width || 80));
      h = Math.max(h, t.posY + (t.height || 80));
    }
    for (const o of layout?.objects ?? []) {
      w = Math.max(w, o.posX + (o.width || 80));
      h = Math.max(h, o.posY + (o.height || 80));
    }
    return { w: w + 24, h: h + 24 };
  }, [layout]);

  function capacityOf(table: Table): number {
    return table.capacityOverride || typeById.get(table.eventTablesId)?.capacity || 1;
  }

  // Toggle a table in/out of the cart. Adding resolves the authoritative price
  // (per-attendee / all-inclusive) from the server at the table's full capacity.
  async function toggleTable(table: Table) {
    const key = `Table:${table.tablesId}`;
    if (inCart(key)) {
      removeKey(key);
      return;
    }
    const cap = capacityOf(table);
    setPending(table.tablesId);
    setErr(null);
    try {
      let subtotal = table.priceCents;
      let fee = table.platformFeeCents;
      if (table.pricesId) {
        const b = await calculatePrice(table.pricesId, cap);
        subtotal = b.subtotalCents;
        fee = b.feeCents;
      }
      upsert({ key, kind: 'Table', refId: table.tablesId, label: table.label, seats: cap, subtotal, fee });
    } catch (caught) {
      setErr(rpcErrorMessage(caught));
    } finally {
      setPending(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tables</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading floor plan…</p> : null}
        {!loading && (layout?.tables ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No tables published yet.</p>
        ) : null}
        {err ? <p className="text-sm text-destructive">{err}</p> : null}

        {layout && (layout.tables.length > 0 || layout.objects.length > 0) ? (
          <div className="overflow-auto rounded-md border bg-muted">
            <div className="relative" style={{ width: canvas.w, height: canvas.h }}>
              {layout.objects.map((o) => (
                <div
                  key={o.layoutObjectsId}
                  title={o.objectType}
                  style={{ position: 'absolute', left: o.posX, top: o.posY, width: o.width || 80, height: o.height || 80 }}
                  className="flex items-center justify-center rounded border border-emerald-700 bg-emerald-600 text-xs text-white"
                >
                  {OBJECT_GLYPH[o.objectType] ?? o.objectType[0]}
                </div>
              ))}
              {layout.tables.map((table) => {
                const type = typeById.get(table.eventTablesId);
                const fill = table.colorOverride || type?.color || '#4f46e5';
                const shape = table.shapeOverride || type?.shape || 'Rectangle';
                const available = table.status === 'Available';
                const sel = inCart(`Table:${table.tablesId}`);
                return (
                  <button
                    key={table.tablesId}
                    type="button"
                    disabled={!available || pending === table.tablesId}
                    title={`${table.label} · ${table.status} · seats ${capacityOf(table)}`}
                    onClick={() => toggleTable(table)}
                    style={{
                      position: 'absolute',
                      left: table.posX,
                      top: table.posY,
                      width: table.width || 80,
                      height: table.height || 80,
                      backgroundColor: available ? fill : '#9ca3af',
                    }}
                    className={`flex items-center justify-center border text-[10px] font-medium text-white ${shapeRadius(shape)} ${
                      available ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed opacity-60'
                    } ${sel ? 'ring-2 ring-black ring-offset-1' : 'border-black/10'}`}
                  >
                    {table.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 px-2 pb-2 text-xs text-muted-foreground">
              Tap an available table to add it (books the whole table at its capacity). Tap again to remove.
              Grey = booked/held. Green = entrance/exit/stage.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(layout?.tables ?? []).map((table) => {
              const sel = inCart(`Table:${table.tablesId}`);
              return (
                <Button
                  key={table.tablesId}
                  size="sm"
                  variant={sel ? 'default' : 'outline'}
                  disabled={table.status !== 'Available' || pending === table.tablesId}
                  onClick={() => toggleTable(table)}
                >
                  {table.label} ·{' '}
                  {centsToUSD(feesIncluded ? addCents(table.priceCents, table.platformFeeCents) : table.priceCents)}
                  {' · '}seats {capacityOf(table)}
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
