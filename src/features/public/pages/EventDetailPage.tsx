import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getEventBySlug,
  getEventLayout,
  calculatePrice,
  listEventTableTypes,
} from '@/features/public/services/publicEventService';
import {
  listEventTicketTypes,
  reserveOpenCapacity,
  reserveTable,
} from '@/features/public/services/paymentService';
import type { EventTicketType } from '@/shared/proto/bookings';
import type { Table } from '@/shared/proto/booking';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { addCents, multiplySeats } from '@/shared/lib/math';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';


export function EventDetailPage() {
  const { slug = '' } = useParams();
  const loader = useCallback(() => getEventBySlug(slug), [slug]);
  const { data: event, loading, error } = useAsync(loader);

  if (loading) {
    return <p className="text-gray-500">Loading…</p>;
  }
  if (error || !event) {
    return <p className="text-red-600">{error ?? 'Event not found.'}</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-gray-700">{event.description}</p>
          <p className="text-sm text-gray-500">Category: {event.category}</p>
          <p className="text-sm text-gray-500">Status: {event.status}</p>
        </CardContent>
      </Card>
      <BookingPanel eventsId={event.eventsId} layoutMode={event.layoutMode} feesIncluded={event.feesIncluded} />
    </div>
  );
}

function BookingPanel({
  eventsId,
  layoutMode,
  feesIncluded,
}: {
  eventsId: string;
  layoutMode: string;
  feesIncluded: boolean;
}) {
  const isTableLayout = layoutMode === 'tables' || layoutMode === 'table' || layoutMode === 'Grid';
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  async function goToCheckout(reserve: () => Promise<{ bookingsId: string }>) {
    setBusy(true);
    setBookingError(null);
    try {
      const { bookingsId } = await reserve();
      navigate(`/checkout/${bookingsId}`);
    } catch (caught) {
      setBookingError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return isTableLayout ? (
    <TablePanel eventsId={eventsId} busy={busy} error={bookingError} onReserve={goToCheckout} feesIncluded={feesIncluded} />
  ) : (
    <OpenCapacityPanel eventsId={eventsId} busy={busy} error={bookingError} onReserve={goToCheckout} feesIncluded={feesIncluded} />
  );
}

interface PanelProps {
  eventsId: string;
  busy: boolean;
  error: string | null;
  onReserve: (reserve: () => Promise<{ bookingsId: string }>) => void;
  feesIncluded: boolean;
}

// Renders the price breakdown: a single all-in total when fees are "included",
// otherwise the itemized price + fee = total.
function PriceBreakdownRows({
  priceLabel,
  subtotal,
  fee,
  total,
  feesIncluded,
}: {
  priceLabel: string;
  subtotal: number;
  fee: number;
  total: number;
  feesIncluded: boolean;
}) {
  if (feesIncluded) {
    return (
      <div className="flex justify-between text-sm font-medium text-gray-700">
        <span>Total</span>
        <span>{centsToUSD(total)}</span>
      </div>
    );
  }
  return (
    <div className="space-y-0.5 text-sm text-gray-700">
      <div className="flex justify-between"><span>{priceLabel}</span><span>{centsToUSD(subtotal)}</span></div>
      <div className="flex justify-between"><span>Service fee</span><span>{centsToUSD(fee)}</span></div>
      <div className="flex justify-between font-medium"><span>Total</span><span>{centsToUSD(total)}</span></div>
    </div>
  );
}

function OpenCapacityPanel({ eventsId, busy, error, onReserve, feesIncluded }: PanelProps) {
  const loader = useCallback(() => listEventTicketTypes(eventsId), [eventsId]);
  const { data: ticketTypes, loading } = useAsync(loader);
  const [selectedId, setSelectedId] = useState('');
  const [seats, setSeats] = useState(1);

  const selected = useMemo<EventTicketType | undefined>(
    () => ticketTypes?.find((t) => t.eventTicketTypesId === selectedId),
    [ticketTypes, selectedId],
  );
  const subtotal = multiplySeats(selected?.priceCents ?? 0, seats);
  const fee = multiplySeats(selected?.platformFeeCents ?? 0, seats);
  const total = addCents(subtotal, fee);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reserve tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <p className="text-sm text-gray-500">Loading ticket types…</p> : null}
        {!loading && (ticketTypes ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No tickets on sale yet.</p>
        ) : null}

        <div className="space-y-2">
          {(ticketTypes ?? []).map((tt) => (
            <button
              key={tt.eventTicketTypesId}
              type="button"
              onClick={() => setSelectedId(tt.eventTicketTypesId)}
              className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                selectedId === tt.eventTicketTypesId ? 'border-black bg-gray-50' : 'border-gray-200'
              }`}
            >
              <span>
                <span className="font-medium">{tt.label}</span>
                {tt.description ? <span className="block text-xs text-gray-500">{tt.description}</span> : null}
              </span>
              <span className="text-right">
                <span className="block font-medium">
                  {centsToUSD(feesIncluded ? addCents(tt.priceCents, tt.platformFeeCents) : tt.priceCents)}
                </span>
                {!feesIncluded && tt.platformFeeCents > 0 ? (
                  <span className="block text-xs text-gray-500">+ {centsToUSD(tt.platformFeeCents)} service fee</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <Label htmlFor="seats">Quantity</Label>
          <Input
            id="seats"
            type="number"
            min={1}
            max={selected?.maxQuantity && selected.maxQuantity > 0 ? selected.maxQuantity : undefined}
            value={seats}
            onChange={(e) => setSeats(Math.max(1, Number(e.target.value)))}
          />
        </div>

        {selected ? (
          <PriceBreakdownRows priceLabel="Ticket price" subtotal={subtotal} fee={fee} total={total} feesIncluded={feesIncluded} />
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button
          disabled={busy || !selected || total <= 0}
          onClick={() =>
            onReserve(() =>
              reserveOpenCapacity({
                eventsId,
                seats,
                eventTicketTypesId: selectedId,
                subtotalCents: subtotal,
                feeCents: fee,
                totalCents: total,
              }),
            )
          }
        >
          {busy ? 'Reserving…' : 'Continue to payment'}
        </Button>
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

function TablePanel({ eventsId, busy, error, onReserve, feesIncluded }: PanelProps) {
  const layoutLoader = useCallback(() => getEventLayout(eventsId), [eventsId]);
  const { data: layout, loading } = useAsync(layoutLoader);
  const typesLoader = useCallback(() => listEventTableTypes(eventsId), [eventsId]);
  const { data: types } = useAsync(typesLoader);
  const typeById = useMemo(
    () => new Map((types ?? []).map((t) => [t.eventTablesId, t])),
    [types],
  );

  // Grid dimensions: use the saved grid, but fall back to the bounds implied by
  // placed tables/objects so the lattice always shows.
  const grid = useMemo(() => {
    let rows = layout?.gridRows ?? 0;
    let cols = layout?.gridCols ?? 0;
    for (const t of layout?.tables ?? []) {
      rows = Math.max(rows, t.gridRow + (t.rowSpan || 1));
      cols = Math.max(cols, t.gridCol + (t.colSpan || 1));
    }
    for (const o of layout?.objects ?? []) {
      rows = Math.max(rows, o.gridRow + 1);
      cols = Math.max(cols, o.gridCol + 1);
    }
    return { rows, cols };
  }, [layout]);

  // Cells covered by a table footprint or an object (skip drawing empty lattice there).
  const covered = useMemo(() => {
    const s = new Set<string>();
    for (const t of layout?.tables ?? [])
      for (let r = t.gridRow; r < t.gridRow + (t.rowSpan || 1); r += 1)
        for (let c = t.gridCol; c < t.gridCol + (t.colSpan || 1); c += 1) s.add(`${r}:${c}`);
    for (const o of layout?.objects ?? []) s.add(`${o.gridRow}:${o.gridCol}`);
    return s;
  }, [layout]);

  const [tableId, setTableId] = useState('');

  const [seats, setSeats] = useState(1);
  const selected = useMemo<Table | undefined>(
    () => layout?.tables.find((t) => t.tablesId === tableId),
    [layout, tableId],
  );

  const priceLoader = useCallback(async () => {
    if (!selected?.pricesId) return null;
    try {
      const b = await calculatePrice(selected.pricesId, seats);
      return { subtotal: b.subtotalCents, fee: b.feeCents, total: b.totalCents };
    } catch {
      return null;
    }
  }, [selected, seats]);
  const priced = useAsync(priceLoader).data;

  const subtotal = priced?.subtotal ?? selected?.priceCents ?? 0;
  const fee = priced?.fee ?? selected?.platformFeeCents ?? 0;
  const total = priced?.total ?? addCents(subtotal, fee);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <p className="text-sm text-gray-500">Loading floor plan…</p> : null}
        {!loading && (layout?.tables ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No tables published yet.</p>
        ) : null}

        {layout && grid.rows > 0 && grid.cols > 0 ? (
          <div className="overflow-auto">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${grid.cols}, 2.5rem)`,
                gridTemplateRows: `repeat(${grid.rows}, 2.5rem)`,
              }}
            >
              {Array.from({ length: grid.rows }).flatMap((_, r) =>
                Array.from({ length: grid.cols })
                  .map((__, c) => ({ r, c }))
                  .filter(({ r, c }) => !covered.has(`${r}:${c}`))
                  .map(({ r, c }) => (
                    <div
                      key={`e${r}:${c}`}
                      style={{ gridRow: `${r + 1}`, gridColumn: `${c + 1}` }}
                      className="h-full w-full rounded border border-gray-200 bg-gray-50"
                    />
                  )),
              )}
              {layout.objects.map((o) => (
                <div
                  key={o.layoutObjectsId}
                  title={o.objectType}
                  style={{ gridRow: `${o.gridRow + 1}`, gridColumn: `${o.gridCol + 1}` }}
                  className="flex h-full w-full items-center justify-center rounded border border-emerald-700 bg-emerald-600 text-xs text-white"
                >
                  {OBJECT_GLYPH[o.objectType] ?? o.objectType[0]}
                </div>
              ))}
              {layout.tables.map((table) => {
                const type = typeById.get(table.eventTablesId);
                const fill = table.colorOverride || type?.color || '#4f46e5';
                const shape = table.shapeOverride || type?.shape || 'Rectangle';
                const available = table.status === 'Available';
                const isSel = tableId === table.tablesId;
                return (
                  <button
                    key={table.tablesId}
                    type="button"
                    disabled={!available}
                    title={`${table.label} · ${table.status}`}
                    onClick={() => setTableId(table.tablesId)}
                    style={{
                      gridRow: `${table.gridRow + 1} / span ${table.rowSpan || 1}`,
                      gridColumn: `${table.gridCol + 1} / span ${table.colSpan || 1}`,
                      backgroundColor: available ? fill : '#9ca3af',
                    }}
                    className={`flex h-full w-full items-center justify-center border text-[10px] font-medium text-white ${shapeRadius(shape)} ${
                      available ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed opacity-60'
                    } ${isSel ? 'ring-2 ring-black ring-offset-1' : 'border-black/10'}`}
                  >
                    {table.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Tap an available table to select. Grey = booked/held. Green = entrance/exit/stage.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(layout?.tables ?? []).map((table) => (
              <Button
                key={table.tablesId}
                size="sm"
                variant={tableId === table.tablesId ? 'default' : 'outline'}
                disabled={table.status !== 'Available'}
                onClick={() => setTableId(table.tablesId)}
              >
                {table.label} ·{' '}
                {centsToUSD(feesIncluded ? addCents(table.priceCents, table.platformFeeCents) : table.priceCents)}
                {!feesIncluded && table.platformFeeCents > 0 ? ` + ${centsToUSD(table.platformFeeCents)} fee` : ''}
              </Button>
            ))}
          </div>
        )}

        {selected ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="table-seats">Attendees</Label>
              <Input
                id="table-seats"
                type="number"
                min={1}
                className="w-24"
                value={seats}
                onChange={(e) => setSeats(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <PriceBreakdownRows priceLabel="Table price" subtotal={subtotal} fee={fee} total={total} feesIncluded={feesIncluded} />
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button
          disabled={busy || !selected || total <= 0}
          onClick={() =>
            onReserve(() =>
              reserveTable({
                eventsId,
                tablesId: tableId,
                seats,
                subtotalCents: subtotal,
                feeCents: fee,
                totalCents: total,
              }),
            )
          }
        >
          {busy ? 'Reserving…' : 'Continue to payment'}
        </Button>
      </CardContent>
    </Card>
  );
}
