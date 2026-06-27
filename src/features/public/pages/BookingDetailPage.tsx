import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getBooking,
  listTickets,
  inviteTicket,
} from '@/features/public/services/ticketService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function BookingDetailPage() {
  const { bookingsId = '' } = useParams();
  const bookingLoader = useCallback(() => getBooking(bookingsId), [bookingsId]);
  const ticketsLoader = useCallback(() => listTickets(bookingsId), [bookingsId]);
  const booking = useAsync(bookingLoader);
  const tickets = useAsync(ticketsLoader);
  const [emails, setEmails] = useState<Record<string, string>>({});

  async function invite(ticketId: string) {
    try {
      await inviteTicket(ticketId, emails[ticketId] ?? '');
      tickets.reload();
    } catch (caught) {
      window.alert(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-4">
      {booking.loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {booking.error ? <p className="text-destructive">{booking.error}</p> : null}
      {booking.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Booking #{booking.data.bookingNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Status: {booking.data.status}</p>
            {booking.data.lines.length > 0 ? (
              <div className="divide-y rounded-md border">
                {booking.data.lines.map((l) => (
                  <div key={l.bookingLinesId} className="flex items-center justify-between px-3 py-1.5">
                    <span>
                      <span className="rounded bg-muted px-1 text-xs uppercase text-muted-foreground">{l.kind}</span>{' '}
                      <span className="font-medium text-foreground">{l.label}</span>
                      <span className="text-muted-foreground"> · {l.seats} {l.seats === 1 ? 'seat' : 'seats'}</span>
                    </span>
                    <span className="font-medium text-foreground">{centsToUSD(l.totalCents)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>Seats reserved: {booking.data.seatsReserved}</p>
            )}
            <p className="font-medium text-foreground">Total: {centsToUSD(booking.data.totalCents)}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(tickets.data ?? []).map((ticket) => (
            <div key={ticket.ticketsId} className="flex flex-wrap items-center gap-2 border-b py-2 text-sm">
              <span className="font-medium">{ticket.ticketCode}</span>
              <span className="text-muted-foreground">seat {ticket.seatNumber}</span>
              <span className="text-muted-foreground">{ticket.status}</span>
              <Input
                className="w-48"
                placeholder="invite email"
                value={emails[ticket.ticketsId] ?? ''}
                onChange={(e) => setEmails((prev) => ({ ...prev, [ticket.ticketsId]: e.target.value }))}
              />
              <Button size="sm" variant="outline" onClick={() => invite(ticket.ticketsId)}>
                Invite
              </Button>
            </div>
          ))}
          {!tickets.loading && (tickets.data ?? []).length === 0 ? (
            <p className="text-muted-foreground">No tickets.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
