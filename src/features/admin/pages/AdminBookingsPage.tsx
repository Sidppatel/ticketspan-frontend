import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listBookings } from '@/features/admin/services/bookingAdminService';
import { downloadCsv, getReportingAccess } from '@/features/admin/services/reportingService';
import { Badge } from '@/shared/ui/badge';
import { centsToUSD, formatEventDate } from '@/shared/lib/format';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { cn } from '@/shared/lib/cn';
import { ChevronDown, ChevronUp, Ticket, Calendar, CreditCard, Download } from 'lucide-react';
import type { Booking } from '@/shared/proto/bookings';

export function AdminBookingsPage() {
  const [eventsId, setEventsId] = useState('');
  
  
  const loader = useCallback(() => listBookings(eventsId, 'Paid'), [eventsId]);
  const { data, loading, error } = useAsync(loader);

  const accessLoader = useCallback(() => getReportingAccess(), []);
  const { data: access } = useAsync(accessLoader);
  const advanced = access?.hasAdvancedReporting ?? false;

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const onExport = () => {
    downloadCsv(
      'bookings.csv',
      ['booking_number', 'event', 'status', 'seats', 'tickets_claimed', 'tickets_total',
       'subtotal', 'fees', 'total', 'transaction_id'],
      (data ?? []).map((b) => [
        b.bookingNumber,
        b.eventTitle,
        b.status,
        b.seatsReserved,
        b.ticketsClaimed,
        b.ticketsTotal,
        centsToUSD(b.subtotalCents),
        centsToUSD(b.feeCents),
        centsToUSD(b.totalCents),
        b.paymentTransactionId,
      ]),
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight font-display text-foreground md:text-3xl">Bookings</h1>
        <p className="text-xs text-muted-foreground">Manage confirmed event reservations and view payment details.</p>
      </div>

      <div className="svyne-float-card border border-border bg-card shadow-xl rounded-2xl overflow-hidden transition-all duration-300">
        <CardHeader className="border-b border-border/20 px-6 py-4">
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5 md:col-span-1">
              <Label>Event ID</Label>
              <div className="svyne-spring-input">
                <Input
                  value={eventsId}
                  onChange={(e) => setEventsId(e.target.value)}
                  placeholder="Filter by Event ID..."
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>
            {advanced ? (
              <div className="md:col-span-2 flex justify-end items-center gap-2">
                <Badge variant="voltage">Pro</Badge>
                <Button variant="outline" size="sm" disabled={(data ?? []).length === 0} onClick={onExport}>
                  <Download /> Export CSV
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 justify-center py-8">
          <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Loading bookings…</p>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 leading-normal">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {(data ?? []).map((booking) => (
          <BookingRow 
            key={booking.bookingsId} 
            booking={booking} 
            isExpanded={expandedId === booking.bookingsId}
            onToggle={() => toggleExpand(booking.bookingsId)}
          />
        ))}
      </div>
      
      {!loading && (data ?? []).length === 0 ? (
        <p className="text-sm font-medium text-muted-foreground text-center py-8">No paid bookings found.</p>
      ) : null}
    </div>
  );
}

function BookingRow({ booking, isExpanded, onToggle }: { booking: Booking; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-all duration-300 overflow-hidden flex flex-col h-fit cursor-pointer hover:border-primary/50",
        isExpanded ? "border-border shadow-md" : "border-border-soft shadow-sm"
      )}
      onClick={onToggle}
    >
      <div className="p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground font-display block">
              Order #{booking.bookingNumber}
            </span>
            <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">
              {booking.eventTitle || 'Unknown Event'} · {booking.seatsReserved} Seats
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="font-bold text-sm text-foreground block">
              {centsToUSD(booking.totalCents)}
            </span>
            <span className="text-[10px] font-bold text-success uppercase tracking-wider bg-success/10 px-2 py-0.5 rounded-full">
              {booking.status}
            </span>
          </div>
          <div className="text-muted-foreground transition-transform duration-200">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out overflow-hidden border-t border-border/10",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="p-5 bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Event Details</p>
                  <p className="text-sm font-medium text-foreground">{booking.eventTitle || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">ID: {booking.eventsId}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Payment Details</p>
                  <p className="text-sm font-medium text-foreground">
                    Tx: {booking.paymentTransactionId || 'N/A'}
                  </p>
                  {Number(booking.paidAt) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Purchased: {formatEventDate(booking.paidAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Payment Summary</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-1 text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-right">{centsToUSD(booking.subtotalCents)}</span>
                    <span className="text-muted-foreground">Fees</span>
                    <span className="font-medium text-right">{centsToUSD(booking.feeCents)}</span>
                    <span className="text-muted-foreground font-semibold pt-1 border-t border-border/40 mt-1">Total Paid</span>
                    <span className="font-bold text-foreground text-right pt-1 border-t border-border/40 mt-1">{centsToUSD(booking.totalCents)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ticket className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Ticket Info</p>
                  <p className="text-sm font-medium text-foreground">{booking.seatsReserved} Total Seats</p>
                  <p className="text-xs text-muted-foreground">{booking.ticketsClaimed} / {booking.ticketsTotal} Tickets Claimed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
