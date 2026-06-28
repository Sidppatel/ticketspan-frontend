import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  createTicketType,
  listTicketTypes,
  deleteTicketType,
  updateTicketType,
} from '@/features/admin/services/eventAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, centsToUsdInput, usdToCents } from '@/shared/lib/format';
import { addCents } from '@/shared/lib/math';
import type { EventTicketType } from '@/shared/proto/bookings';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Pencil, Ticket, Trash2 } from 'lucide-react';

export function TicketTypesManager({ eventsId }: { eventsId: string }) {
  const loader = useCallback(() => listTicketTypes(eventsId), [eventsId]);
  const ticketTypes = useAsync(loader);
  const [notice, setNotice] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(0);

  async function guard(action: () => Promise<void>) {
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
          <Ticket />
        </span>
        <CardTitle>Ticket types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice ? <p className="text-sm text-amber-foreground">{notice}</p> : null}

        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
          <div className="space-y-1">
            <Label>Label</Label>
            <Input className="w-40" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="General" />
          </div>
          <div className="space-y-1">
            <Label>Price (USD)</Label>
            <Input
              className="w-28"
              type="number"
              min={0}
              step="0.01"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <Label>Capacity</Label>
            <Input
              className="w-24"
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-48">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button
            size="sm"
            disabled={!label.trim()}
            onClick={() =>
              guard(() =>
                createTicketType({
                  eventsId,
                  label: label.trim(),
                  priceCents: usdToCents(priceUsd),
                  feeFormulasId: '',
                  maxQuantity: 0,
                  sortOrder: 0,
                  description,
                  capacity,
                }).then(() => {
                  setLabel('');
                  setPriceUsd('');
                  setDescription('');
                  setCapacity(0);
                  ticketTypes.reload();
                }),
              )
            }
          >
            Add ticket type
          </Button>
        </div>

        {ticketTypes.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {!ticketTypes.loading && (ticketTypes.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No ticket types yet.</p>
        ) : null}

        <div className="space-y-2">
          {(ticketTypes.data ?? []).map((tt) => (
            <TicketTypeRow key={tt.eventTicketTypesId} eventsId={eventsId} tt={tt} onChanged={ticketTypes.reload} onError={setNotice} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TicketTypeRow({
  eventsId,
  tt,
  onChanged,
  onError,
}: {
  eventsId: string;
  tt: EventTicketType;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(tt.label);
  const [priceUsd, setPriceUsd] = useState(centsToUsdInput(tt.priceCents));
  const [description, setDescription] = useState(tt.description);
  const [capacity, setCapacity] = useState(tt.capacity);

  async function guard(action: () => Promise<void>) {
    try {
      await action();
    } catch (caught) {
      onError(rpcErrorMessage(caught));
    }
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
        <div className="space-y-1">
          <Label>Label</Label>
          <Input className="w-40" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Price (USD)</Label>
          <Input className="w-28" type="number" min={0} step="0.01" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Capacity</Label>
          <Input className="w-24" type="number" min={0} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        </div>
        <div className="space-y-1 flex-1 min-w-48">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button
          size="sm"
          disabled={!label.trim()}
          onClick={() =>
            guard(() =>
              updateTicketType(tt.eventTicketTypesId, {
                eventsId,
                label: label.trim(),
                priceCents: usdToCents(priceUsd),
                feeFormulasId: tt.feeFormulasId,
                maxQuantity: tt.maxQuantity,
                sortOrder: 0,
                description,
                capacity,
              }).then(() => {
                setEditing(false);
                onChanged();
              }),
            )
          }
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm">
      <div className="min-w-0">
        <span className="font-medium">{tt.label}</span>
        {tt.description ? <span className="block truncate text-xs text-muted-foreground">{tt.description}</span> : null}
        {tt.capacity ? <span className="block text-xs text-muted-foreground">Capacity {tt.capacity}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-muted-foreground tabular-nums">
          {centsToUSD(tt.priceCents)} + fee {centsToUSD(tt.platformFeeCents)} ={' '}
          <span className="font-medium text-foreground">{centsToUSD(addCents(tt.priceCents, tt.platformFeeCents))}</span>
        </span>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => guard(() => deleteTicketType(tt.eventTicketTypesId).then(onChanged))}>
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
