import { Users, CheckCircle2, Ticket, Sparkles, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import type { GuestBooking, GuestTicket } from '@/shared/proto/bookings';
import { cn } from '@/shared/lib/cn';

interface BookingCheckInModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: GuestBooking | null;
  onCheckInAll: (booking: GuestBooking) => Promise<void>;
  onCheckInSingle: (ticket: GuestTicket) => Promise<void>;
  isProcessing: boolean;
}

export function BookingCheckInModal({
  isOpen,
  onOpenChange,
  booking,
  onCheckInAll,
  onCheckInSingle,
  isProcessing,
}: BookingCheckInModalProps) {
  if (!booking) return null;

  const tickets = booking.tickets || [];
  const pendingTickets = tickets.filter((t) => t.status !== 'CheckedIn');
  const alreadyCheckedInCount = tickets.length - pendingTickets.length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden border border-border shadow-2xl rounded-3xl">
        <div className="bg-gradient-to-b from-primary/15 via-primary/5 to-transparent p-6 pb-4 border-b border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="neutral" className="font-mono text-[11px] font-bold uppercase tracking-wider">
              Booking #{booking.bookingNumber}
            </Badge>
            <Badge variant={pendingTickets.length === 0 ? 'success' : 'warn'} className="text-[10px] font-bold">
              {alreadyCheckedInCount}/{tickets.length} Checked In
            </Badge>
          </div>
          <DialogTitle className="text-xl font-extrabold font-display text-foreground tracking-tight flex items-center gap-2">
            <Users className="size-5 text-primary" /> Group Check-In
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Purchaser: <span className="font-semibold text-foreground">{booking.buyerName}</span> • {tickets.length} total pass{tickets.length > 1 ? 'es' : ''}
          </DialogDescription>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {pendingTickets.length === 0 ? (
            <div className="rounded-2xl border border-success/30 bg-success/10 p-5 text-center space-y-2">
              <CheckCircle2 className="size-8 text-success mx-auto" />
              <p className="text-sm font-bold text-success-foreground">All Guests Checked In!</p>
              <p className="text-xs text-muted-foreground">Every ticket in this booking has already been verified and checked in.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                <span className="font-bold uppercase tracking-wider text-[10px]">Attendee Passes</span>
                <span className="font-medium text-[11px]">{pendingTickets.length} pending</span>
              </div>

              <div className="space-y-2">
                {tickets.map((t) => {
                  const isCheckedIn = t.status === 'CheckedIn';
                  return (
                    <div
                      key={t.ticketsId}
                      className={cn(
                        'flex items-center justify-between p-3.5 rounded-xl border transition-all',
                        isCheckedIn
                          ? 'border-border/40 bg-muted/20 opacity-75'
                          : 'border-border bg-card shadow-sm hover:border-primary/40',
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Ticket className={cn('size-3.5', isCheckedIn ? 'text-success' : 'text-primary')} />
                          <span className="text-xs font-bold text-foreground">
                            {t.guestName || 'Unnamed Guest'}
                          </span>
                          {t.seatNumber > 0 && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                              Seat #{t.seatNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground tracking-wide pl-5.5">
                          {t.ticketCode}
                        </p>
                      </div>

                      <div>
                        {isCheckedIn ? (
                          <Badge variant="success" className="text-[10px] font-bold gap-1">
                            <Check className="size-3" /> Checked In
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                            onClick={() => void onCheckInSingle(t)}
                            className="h-7 px-3 text-[11px] font-bold rounded-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-border/40 bg-muted/10 flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="h-9 text-xs font-bold"
          >
            Close
          </Button>

          {pendingTickets.length > 0 && (
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={() => void onCheckInAll(booking)}
              className="ticketspan-spring-btn h-9 px-5 text-xs font-bold rounded-xl gap-1.5 shadow-md"
            >
              <Sparkles className="size-3.5" />
              Check In All ({pendingTickets.length})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
