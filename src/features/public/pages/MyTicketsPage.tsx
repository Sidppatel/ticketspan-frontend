import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listMyTickets } from '@/features/public/services/ticketService';
import { formatEpoch } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card, CardContent } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';

export function MyTicketsPage() {
  const loader = useCallback(() => listMyTickets(), []);
  const { data: tickets, loading, error } = useAsync(loader);
  const [activeQr, setActiveQr] = useState<{ qrToken: string; label: string; bookingNumber?: string } | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">My Tickets</h1>
        <p className="text-muted-foreground mt-1">View your claimed or received tickets. Present the QR code at the check-in scanner for entry.</p>
      </div>

      {error ? <p className="text-destructive font-medium">{error}</p> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(tickets ?? []).map((ticket) => (
            <Card
              key={ticket.ticketsId}
              className="relative overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl"
            >
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/events/${ticket.eventSlug}`}
                        className="font-semibold text-lg text-foreground hover:text-primary transition-colors truncate max-w-[240px]"
                      >
                        {ticket.eventTitle}
                      </Link>
                      <span className="inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {ticket.ticketTypeLabel || 'General Entry'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{ticket.venueName}</p>
                    <p className="text-xs text-muted-foreground/80">{formatEpoch(ticket.eventStartDate)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      Code: {ticket.ticketCode}
                    </span>
                    <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      Seat: {ticket.seatNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      ticket.status === 'CheckedIn' 
                        ? 'bg-success/15 text-success' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {ticket.status === 'CheckedIn' ? 'Checked In' : ticket.status}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center gap-1.5 p-2 bg-white rounded-lg border">
                  {ticket.qrToken ? (
                    <button
                      type="button"
                      onClick={() => setActiveQr({
                        qrToken: ticket.qrToken,
                        label: `${ticket.ticketTypeLabel || 'General Entry'} (${ticket.ticketCode})`,
                        bookingNumber: ticket.bookingNumber,
                      })}
                      className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(ticket.qrToken)}`}
                        alt="Ticket QR Code"
                        className="w-[110px] h-[110px] object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider group-hover:text-primary transition-colors">Scan Entry</span>
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">No QR code</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (tickets ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground bg-card/30">
          <p className="text-lg font-medium">No tickets found</p>
          <p className="text-sm text-muted-foreground mt-1">Claim your tickets from your bookings or wait for an invitation.</p>
          <Link to="/" className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Browse Events
          </Link>
        </div>
      ) : null}

      <Dialog open={activeQr !== null} onOpenChange={(open) => { if (!open) setActiveQr(null); }}>
        <DialogContent className="max-w-xs md:max-w-md flex flex-col items-center p-6 space-y-4 rounded-xl">
          <DialogTitle className="text-center text-xl font-bold">Entry Pass</DialogTitle>
          {activeQr && (
            <>
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activeQr.qrToken)}`}
                  alt="QR Code"
                  className="w-[250px] h-[250px]"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">Scan at the event gate</p>
                <p className="font-mono text-lg font-bold text-foreground tracking-wide mt-2">
                  {activeQr.label}
                </p>
                {activeQr.bookingNumber && (
                  <p className="text-xs text-muted-foreground font-mono">
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
