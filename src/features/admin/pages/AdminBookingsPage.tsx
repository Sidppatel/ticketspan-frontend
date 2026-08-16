import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listBookings } from '@/features/admin/services/bookingAdminService';
import { listAdminEvents } from '@/features/admin/services/adminService';
import { downloadCsv, getReportingAccess } from '@/features/admin/services/reportingService';
import { Badge } from '@/shared/ui/badge';
import { centsToUSD, formatEventDate } from '@/shared/lib/format';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { cn } from '@/shared/lib/cn';
import { EventSearchAutocomplete } from '@/features/admin/components/EventSearchAutocomplete';
import {
  ChevronDown,
  ChevronUp,
  Ticket,
  Calendar,
  CreditCard,
  Download,
  Receipt,
  Search,
  Users,
} from 'lucide-react';
import type { Booking } from '@/shared/proto/bookings';

export function AdminBookingsPage() {
  const [eventsId, setEventsId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const eventsLoader = useCallback(() => listAdminEvents(), []);
  const { data: events, loading: loadingEvents } = useAsync(eventsLoader);

  const loader = useCallback(
    () => listBookings(eventsId, 'Paid', searchQuery),
    [eventsId, searchQuery],
  );
  const { data, loading, error } = useAsync(loader);

  const accessLoader = useCallback(() => getReportingAccess(), []);
  const { data: access } = useAsync(accessLoader);
  const advanced = access?.hasAdvancedReporting ?? false;

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const onExport = () => {
    downloadCsv(
      'bookings.csv',
      [
        'Order Number',
        'Customer Name',
        'Customer Email',
        'Event Title',
        'Status',
        'Seats Reserved',
        'Tickets Claimed',
        'Tickets Total',
        'Subtotal',
        'Service Fees',
        'Tax',
        'Total Paid',
        'Payment Method',
        'Card Brand',
        'Card Last 4',
        'Transaction ID',
      ],
      (data ?? []).map((b) => [
        b.bookingNumber,
        b.userName || 'Guest Buyer',
        b.userEmail || 'N/A',
        b.eventTitle,
        b.status,
        b.seatsReserved,
        b.ticketsClaimed,
        b.ticketsTotal,
        centsToUSD(b.subtotalCents),
        centsToUSD(b.serviceFeeCents),
        centsToUSD(b.taxCents),
        centsToUSD(b.totalCents),
        b.paymentMethodType || 'Card',
        b.paymentMethodBrand || 'N/A',
        b.paymentMethodLast4 ? `•••• ${b.paymentMethodLast4}` : 'N/A',
        b.paymentTransactionId,
      ]),
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight font-display text-foreground md:text-3xl">
            Bookings & Reservations
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage confirmed reservations, lookup attendees, and inspect transaction ledgers.
          </p>
        </div>

        {data && data.length > 0 ? (
          <Badge variant="neutral" className="self-start sm:self-auto font-mono text-xs">
            {data.length} {data.length === 1 ? 'Booking' : 'Bookings'}
          </Badge>
        ) : null}
      </div>

      <div className="ticketspan-float-card border border-border bg-card shadow-xl rounded-2xl overflow-visible transition-all duration-300">
        <CardHeader className="border-b border-border/20 px-6 py-4">
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="space-y-1.5 md:col-span-6">
              <Label className="text-xs font-semibold">Event</Label>
              <EventSearchAutocomplete
                events={events ?? []}
                selectedEventsId={eventsId}
                onSelectEvent={setEventsId}
                isLoading={loadingEvents}
              />
            </div>

            <div className="space-y-1.5 md:col-span-4">
              <Label className="text-xs font-semibold">Order / Attendee Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Order #, name, or email…"
                  className="h-10 pl-9 bg-background border-border text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end items-center gap-2">
              {advanced ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-full text-xs gap-1.5"
                  disabled={(data ?? []).length === 0}
                  onClick={onExport}
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
              ) : null}
            </div>
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
        <p className="text-sm font-medium text-muted-foreground text-center py-8">
          No paid bookings found matching your criteria.
        </p>
      ) : null}
    </div>
  );
}

function BookingRow({
  booking,
  isExpanded,
  onToggle,
}: {
  booking: Booking;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-card transition-all duration-300 overflow-hidden flex flex-col h-fit cursor-pointer hover:border-primary/50',
        isExpanded ? 'border-border shadow-md' : 'border-border-soft shadow-sm',
      )}
      onClick={onToggle}
    >
      <div className="p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground font-display">
                Order #{booking.bookingNumber}
              </span>
              {booking.userName && (
                <span className="text-xs font-medium text-foreground">
                  · {booking.userName}
                </span>
              )}
            </div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground block mt-0.5">
              {booking.eventTitle || 'Unknown Event'} · {booking.seatsReserved} Seats
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="font-bold text-sm text-foreground block font-mono">
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

      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out overflow-hidden border-t border-border/10',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="p-5 bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Event Details
                  </p>
                  <p className="text-sm font-medium text-foreground">{booking.eventTitle || 'N/A'}</p>
                  {booking.eventStartDate && booking.eventStartDate !== '0' && (
                    <p className="text-xs text-muted-foreground">
                      {formatEventDate(booking.eventStartDate)}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    ID: {booking.eventsId}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Customer Information
                  </p>
                  <p className="text-sm font-medium text-foreground">{booking.userName || 'Guest Buyer'}</p>
                  <p className="text-xs text-muted-foreground">{booking.userEmail || 'No email provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Receipt className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Payment Details
                  </p>
                  <p className="text-sm font-medium text-foreground font-mono">
                    {booking.paymentTransactionId || 'No Transaction ID'}
                  </p>
                  {booking.paidAt && booking.paidAt !== '0' && (
                    <p className="text-xs text-muted-foreground">
                      Purchased: {formatEventDate(booking.paidAt)}
                    </p>
                  )}
                  {booking.paymentMethodType && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {booking.paymentMethodType.replace('_', ' ')}
                      {booking.paymentMethodBrand ? ` (${booking.paymentMethodBrand})` : ''}
                      {booking.paymentMethodLast4 ? ` •••• ${booking.paymentMethodLast4}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Payment Summary
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-1 text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-right font-mono">{centsToUSD(booking.subtotalCents)}</span>
                    <span className="text-muted-foreground">Fees</span>
                    <span className="font-medium text-right font-mono">{centsToUSD(booking.serviceFeeCents)}</span>
                    {booking.taxCents > 0 && (
                      <>
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium text-right font-mono">{centsToUSD(booking.taxCents)}</span>
                      </>
                    )}
                    <span className="text-muted-foreground font-semibold pt-1 border-t border-border/40 mt-1">
                      Total Paid
                    </span>
                    <span className="font-bold text-foreground text-right font-mono pt-1 border-t border-border/40 mt-1">
                      {centsToUSD(booking.totalCents)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ticket className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Ticket Info
                  </p>
                  <p className="text-sm font-medium text-foreground">{booking.seatsReserved} Total Seats</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.ticketsClaimed} / {booking.ticketsTotal} Tickets Claimed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
