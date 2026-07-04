import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Ticket as TicketIcon, MapPin, Calendar, ChevronDown, CreditCard } from 'lucide-react';
import { playSuccessChime } from '@/shared/lib/haptic';
import { QrImage } from '@/features/public/components/wallet/QrImage';
import { useAsync } from '@/shared/hooks/useAsync';
import { useAuth } from '@/shared/auth/useAuth';
import {
  getBooking,
  listTickets,
  inviteTicket,
  claimTicketSelf,
  revokeTicket,
} from '@/features/public/services/ticketService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, formatEventDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';

const NOTCH = { ['--svyne-notch' as string]: 'var(--background)' } as CSSProperties;

const STATUS_STYLE: Record<string, string> = {
  Confirmed: 'bg-success/10 text-success',
  Paid: 'bg-success/10 text-success',
  Pending: 'bg-warning/10 text-warning',
  Cancelled: 'bg-destructive/10 text-destructive',
  Refunded: 'bg-muted text-muted-foreground',
};

function statusClass(status: string): string {
  return STATUS_STYLE[status] ?? 'bg-muted text-muted-foreground';
}

export function BookingDetailPage() {
  const { bookingsId = '' } = useParams();
  const location = useLocation();
  const justPaid = Boolean((location.state as { justPaid?: boolean } | null)?.justPaid);
  const { user } = useAuth();

  useEffect(() => {
    if (justPaid) playSuccessChime();
  }, [justPaid]);
  const bookingLoader = useCallback(() => getBooking(bookingsId), [bookingsId]);
  const ticketsLoader = useCallback(() => listTickets(bookingsId), [bookingsId]);
  const booking = useAsync(bookingLoader);
  const tickets = useAsync(ticketsLoader);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [activeQr, setActiveQr] = useState<{ qrToken: string; label: string; bookingNumber?: string } | null>(null);

  async function invite(ticketId: string) {
    try {
      await inviteTicket(ticketId, emails[ticketId] ?? '');
      tickets.reload();
    } catch (caught) {
      window.alert(rpcErrorMessage(caught));
    }
  }

  async function handleClaimSelf(ticketId: string) {
    try {
      await claimTicketSelf(ticketId);
      tickets.reload();
    } catch (caught) {
      window.alert(rpcErrorMessage(caught));
    }
  }

  async function handleRevoke(ticketId: string) {
    try {
      await revokeTicket(ticketId);
      tickets.reload();
    } catch (caught) {
      window.alert(rpcErrorMessage(caught));
    }
  }

  const b = booking.data;
  const venue = b?.venueAddress || b?.venueName || (tickets.data ?? []).find((t) => t.venueName)?.venueName || '';
  const firstName = user?.firstName?.trim() ?? '';
  const title = b
    ? firstName
      ? `${firstName}'s tickets for ${b.eventTitle || 'your event'}`
      : `Your tickets for ${b.eventTitle || 'your event'}`
    : '';

  return (
    <div className="space-y-4">
      {justPaid ? (
        <div className="svyne-page overflow-hidden rounded-lg border border-success/25 bg-surface shadow-[var(--shadow-e1)]">
          <div className="flex items-center gap-3 p-5">
            <CheckCircle2 className="size-6 shrink-0 text-success" />
            <div>
              <p className="font-display text-lg font-semibold text-ink">You're going.</p>
              <p className="text-sm text-ink-soft">
                Payment confirmed — your tickets are below and in your wallet.
              </p>
            </div>
          </div>
          <div className="svyne-ticket-edge" style={NOTCH} />
          <div className="h-3" />
        </div>
      ) : null}

      {booking.loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {booking.error ? <p className="text-destructive">{booking.error}</p> : null}

      {b ? (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
              <span className="font-mono text-xs text-muted-foreground">Booking #{b.bookingNumber}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {b.eventStartDate && b.eventStartDate !== '0' ? (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{formatEventDate(b.eventStartDate)}</span>
                </div>
              ) : null}
              {venue ? (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{venue}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-sm">
                <TicketIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-foreground">
                  {b.ticketsTotal} {b.ticketsTotal === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>
              {b.paidAt && b.paidAt !== '0' ? (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">Paid {formatEventDate(b.paidAt)}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(b.status)}`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {b ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Tickets {(tickets.data ?? []).length > 0 ? `(${(tickets.data ?? []).length})` : ''}
            </h2>
            {(() => {
              const hasClaimedAny = (tickets.data ?? []).some(
                (t) => t.guestUsersId === user?.usersId && (t.status === 'Claimed' || t.status === 'CheckedIn')
              );
              return (tickets.data ?? []).map((ticket) => {
                const isClaimedByMe = ticket.guestUsersId === user?.usersId && ticket.status === 'Claimed';
                const isClaimedByOthers = ticket.status === 'Claimed' && ticket.guestUsersId !== user?.usersId;
                return (
                  <div
                    key={ticket.ticketsId}
                    className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                  >
                    {ticket.qrToken && (
                      <button
                        type="button"
                        onClick={() => setActiveQr({
                          qrToken: ticket.qrToken,
                          label: `Ticket: ${ticket.ticketCode}`,
                          bookingNumber: b.bookingNumber,
                        })}
                        className="shrink-0 rounded border bg-white p-1 transition-colors hover:bg-muted"
                      >
                        <QrImage value={ticket.qrToken} size={40} className="h-10 w-10 object-contain" />
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {ticket.ticketTypeLabel || 'General Admission'}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {ticket.ticketCode} · seat {ticket.seatNumber}
                      </p>
                    </div>
                    {ticket.status === 'CheckedIn' ? (
                      <span className="rounded-md bg-success/10 px-2 py-0.5 text-sm font-semibold text-success">
                        Checked in
                      </span>
                    ) : isClaimedByMe ? (
                      <Button size="sm" variant="destructive" onClick={() => handleRevoke(ticket.ticketsId)}>
                        Revoke
                      </Button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          className="w-44"
                          placeholder="invite email"
                          value={emails[ticket.ticketsId] ?? ''}
                          onChange={(e) => setEmails((prev) => ({ ...prev, [ticket.ticketsId]: e.target.value }))}
                          disabled={hasClaimedAny || isClaimedByOthers}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => invite(ticket.ticketsId)}
                          disabled={hasClaimedAny || isClaimedByOthers || !(emails[ticket.ticketsId] ?? '').trim()}
                        >
                          Invite
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClaimSelf(ticket.ticketsId)}
                          disabled={hasClaimedAny || isClaimedByOthers}
                        >
                          Claim for myself
                        </Button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
            {!tickets.loading && (tickets.data ?? []).length === 0 ? (
              <p className="text-muted-foreground">No tickets.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {b ? (
        <Card>
          <CardContent className="p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-6">
                <span className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                  <CreditCard className="size-5 text-muted-foreground" />
                  Payment details
                </span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {centsToUSD(b.totalCents)}
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div className="space-y-2 border-t px-6 pb-6 pt-4 text-sm">
                {b.feesIncluded ? null : (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{centsToUSD(b.subtotalCents)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Service fee</span>
                      <span>{centsToUSD(b.feeCents)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t pt-2 font-medium text-foreground">
                  <span>Total</span>
                  <span>{centsToUSD(b.totalCents)}</span>
                </div>
                {b.paymentTransactionId ? (
                  <div className="flex justify-between border-t pt-3 text-muted-foreground">
                    <span>Transaction ID</span>
                    <span className="font-mono text-xs">{b.paymentTransactionId}</span>
                  </div>
                ) : null}
              </div>
            </details>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={activeQr !== null} onOpenChange={(open) => { if (!open) setActiveQr(null); }}>
        <DialogContent className="flex max-w-xs flex-col items-center space-y-4 rounded-xl p-6 md:max-w-md">
          <DialogTitle className="text-center text-xl font-bold">Entry Pass</DialogTitle>
          {activeQr && (
            <>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <QrImage value={activeQr.qrToken} size={250} />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm text-muted-foreground">Scan at the event gate</p>
                <p className="mt-2 font-mono text-lg font-bold tracking-wide text-foreground">
                  {activeQr.label}
                </p>
                {activeQr.bookingNumber && (
                  <p className="font-mono text-xs text-muted-foreground">
                    Booking: #{activeQr.bookingNumber}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
