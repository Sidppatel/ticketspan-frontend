import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listBookings,
  cancelBooking,
  refundBooking,
  confirmBooking,
} from '@/features/admin/services/bookingAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent } from '@/shared/ui/card';

export function AdminBookingsPage() {
  const [eventsId, setEventsId] = useState('');
  const [status, setStatus] = useState('');
  const loader = useCallback(() => listBookings(eventsId, status), [eventsId, status]);
  const { data, loading, error, reload } = useAsync(loader);

  async function act(action: () => Promise<void>) {
    try {
      await action();
      reload();
    } catch (caught) {
      window.alert(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Bookings</h1>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Event ID</Label>
          <Input value={eventsId} onChange={(e) => setEventsId(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="paid / pending…" />
        </div>
      </div>
      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="space-y-2">
        {(data ?? []).map((booking) => (
          <Card key={booking.bookingsId}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm">
                <p className="font-medium">#{booking.bookingNumber}</p>
                <p className="text-muted-foreground">
                  {booking.status} · {centsToUSD(booking.totalCents)} · seats {booking.seatsReserved}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => act(() => confirmBooking(booking.bookingsId, ''))}>
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => act(() => cancelBooking(booking.bookingsId))}>
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={() => act(() => refundBooking(booking.bookingsId))}>
                  Refund
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!loading && (data ?? []).length === 0 ? <p className="text-muted-foreground">No bookings.</p> : null}
    </div>
  );
}
