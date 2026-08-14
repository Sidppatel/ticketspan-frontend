import { CheckCircle2, ChevronRight, Sparkles, Undo2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { GuestBooking, GuestTicket } from '@/shared/proto/bookings';

interface StaffGuestListProps {
  loading: boolean;
  error: string | null;
  filteredBookings: GuestBooking[];
  checkingIn: boolean;
  setPendingBooking: (booking: GuestBooking) => void;
  setUncheckTarget: (target: { ticketsId: string; guestName: string }) => void;
  handleActionCheckIn: (id: string, mode: 'Ticket' | 'Booking') => void;
}

export function StaffGuestList({
  loading,
  error,
  filteredBookings,
  checkingIn,
  setPendingBooking,
  setUncheckTarget,
  handleActionCheckIn,
}: StaffGuestListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="size-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider animate-pulse">
          Loading guest list...
        </p>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center py-12 text-xs font-semibold">{error}</p>;
  }

  if (filteredBookings.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground space-y-3 max-w-sm mx-auto">
        <div className="inline-flex p-3 bg-muted/40 rounded-full text-muted-foreground/60">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">No matching guests found</p>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Try modifying search tags or check in codes manually.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/20 max-h-[600px] overflow-y-auto">
      {filteredBookings.map((b) => (
        <div key={b.bookingsId} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2 border-dashed border-border/20">
            <div>
              <p className="font-bold text-sm text-foreground">{b.buyerName}</p>
              <p className="text-[10px] text-muted-foreground">
                Booking: <span className="font-mono text-foreground/80">{b.bookingNumber}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                  b.status === 'CheckedIn'
                    ? 'bg-success/10 text-success border-success/15'
                    : 'bg-primary/10 text-primary border-primary/15'
                }`}
              >
                {b.status === 'CheckedIn' ? 'All In' : b.status}
              </span>
              {b.status !== 'CheckedIn' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPendingBooking(b)}
                  disabled={checkingIn}
                  className="h-7 px-3 text-[10px] font-semibold border-border hover:bg-muted"
                >
                  Check In All
                </Button>
              )}
            </div>
          </div>

          <div className="pl-2 space-y-2">
            {b.tickets.map((t: GuestTicket) => (
              <div key={t.ticketsId} className="flex items-center justify-between py-1 text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">
                    Seat #{t.seatNumber} : {t.guestName}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-mono">Ticket Code: {t.ticketCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  {t.status === 'CheckedIn' ? (
                    <>
                      <span className="text-[10px] font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded border border-success/15">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Checked In
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setUncheckTarget({ ticketsId: t.ticketsId, guestName: t.guestName })}
                        disabled={checkingIn}
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                      >
                        <Undo2 className="h-3 w-3 mr-0.5" /> Undo
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          t.status === 'Claimed'
                            ? 'bg-marigold/10 text-marigold border-marigold/15'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {t.status}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleActionCheckIn(t.ticketsId, 'Ticket')}
                        disabled={checkingIn}
                        className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 rounded-md"
                      >
                        Check In <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
