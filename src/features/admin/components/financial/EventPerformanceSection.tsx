import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import {
  ChevronDown,
  Download,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  Users,
  DollarSign,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { centsToUSD, formatEventDate } from '@/shared/lib/format';
import {
  downloadCsv,
  bpsToPercentLabel,
  salesVelocityLabel,
} from '@/features/admin/services/reportingService';
import { listBookings } from '@/features/admin/services/bookingAdminService';
import type { EventPerformanceRow, TicketTypeBreakdownRow } from '@/shared/proto/reporting';

interface EventPerformanceSectionProps {
  events: EventPerformanceRow[];
  ticketTypes: TicketTypeBreakdownRow[];
  isAdvanced: boolean;
}

export function EventPerformanceSection({
  events,
  ticketTypes,
  isAdvanced,
}: EventPerformanceSectionProps) {
  const [search, setSearch] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [exportingEventId, setExportingEventId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) =>
    e.eventTitle.toLowerCase().includes(search.toLowerCase()),
  );

  function exportEventsSummaryCsv() {
    downloadCsv(
      'event-performance-summary.csv',
      [
        'Event Title',
        'Start Date',
        'Status',
        'Gross Revenue',
        'Orders',
        'Tickets Sold',
        'Checked In',
        'Attendance Rate',
        'Capacity',
        'Capacity Used',
        'Sales Velocity',
        'Revenue Per Attendee',
        'Refunded Amount',
        'Refunded Orders',
      ],
      events.map((e) => [
        e.eventTitle,
        formatEventDate(e.eventStartEpochSeconds),
        e.eventStatus,
        centsToUSD(e.revenueCents),
        e.orders,
        e.ticketsSold,
        e.checkedIn,
        bpsToPercentLabel(e.attendanceRateBps),
        e.capacity,
        bpsToPercentLabel(e.capacityUsedBps),
        salesVelocityLabel(e.salesPerDayMilli),
        centsToUSD(e.revenuePerAttendeeCents),
        centsToUSD(e.refundedCents),
        e.refundedOrders,
      ]),
    );
  }

  async function exportEventTransactions(e: EventPerformanceRow) {
    setExportingEventId(e.eventsId);
    try {
      const bookings = await listBookings(e.eventsId, '');
      const slug = e.eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      downloadCsv(
        `${slug}-transactions.csv`,
        [
          'Order Number',
          'Booking ID',
          'Purchase Date',
          'Customer Name',
          'Customer Email',
          'Event Title',
          'Status',
          'Tickets / Seats Count',
          'Tickets Claimed',
          'Subtotal',
          'Service Fees',
          'Sales Tax',
          'Total Paid',
          'Payment Method',
          'Card Brand',
          'Card Last 4',
          'Transaction ID',
          'Venue Name',
        ],
        bookings.map((b) => [
          b.bookingNumber,
          b.bookingsId,
          b.paidAt ? formatEventDate(b.paidAt) : 'N/A',
          b.userName || 'Guest Buyer',
          b.userEmail || 'N/A',
          b.eventTitle || e.eventTitle,
          b.status,
          b.seatsReserved,
          b.ticketsClaimed,
          centsToUSD(b.subtotalCents),
          centsToUSD(b.serviceFeeCents),
          centsToUSD(b.taxCents),
          centsToUSD(b.totalCents),
          b.paymentMethodType || 'Card',
          b.paymentMethodBrand || 'N/A',
          b.paymentMethodLast4 ? `•••• ${b.paymentMethodLast4}` : 'N/A',
          b.paymentTransactionId || 'N/A',
          b.venueName || 'N/A',
        ]),
      );
    } finally {
      setExportingEventId(null);
    }
  }

  return (
    <Card className="border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold font-display text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Event Performance & Transactions
            </CardTitle>
            {isAdvanced && <Badge variant="voltage">Pro</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            Analyze gross sales, check-in rates, and export individual event transaction ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-background border-border/70"
            />
          </div>

          {isAdvanced && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 shrink-0"
              disabled={events.length === 0}
              onClick={exportEventsSummaryCsv}
            >
              <Download className="h-3.5 w-3.5" />
              Summary CSV
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredEvents.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            No events found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredEvents.map((row) => {
              const isExpanded = expandedEventId === row.eventsId;
              const isExporting = exportingEventId === row.eventsId;
              const eventItems = ticketTypes.filter((t) => t.eventsId === row.eventsId);

              return (
                <div key={row.eventsId} className="group transition-colors hover:bg-muted/15">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedEventId(isExpanded ? null : row.eventsId)}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isExpanded ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate font-display">
                            {row.eventTitle}
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                              row.eventStatus.toLowerCase() === 'active' || row.eventStatus.toLowerCase() === 'live'
                                ? 'bg-success/15 text-success'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {row.eventStatus}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {formatEventDate(row.eventStartEpochSeconds)}
                          <span>·</span>
                          <span>{row.orders} orders</span>
                          <span>·</span>
                          <span>{row.ticketsSold} sold</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-auto">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground font-mono">
                          {centsToUSD(row.revenueCents)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {bpsToPercentLabel(row.attendanceRateBps)} check-in ({row.checkedIn}/{row.ticketsSold})
                        </p>
                      </div>

                      {isAdvanced && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 shadow-xs"
                          disabled={isExporting}
                          onClick={(e) => {
                            e.stopPropagation();
                            void exportEventTransactions(row);
                          }}
                        >
                          {isExporting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                          )}
                          Export Ledger
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-muted/30 border-t border-border/30 px-6 py-5 space-y-5 animate-in fade-in-50 duration-200">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 text-xs">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            Capacity Used
                          </p>
                          <p className="text-sm font-medium">
                            {row.capacity > 0 ? `${bpsToPercentLabel(row.capacityUsedBps)} (${row.ticketsSold}/${row.capacity})` : 'Unlimited'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            Sales Velocity
                          </p>
                          <p className="text-sm font-medium font-mono">
                            {salesVelocityLabel(row.salesPerDayMilli)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            Rev / Attendee
                          </p>
                          <p className="text-sm font-medium font-mono">
                            {centsToUSD(row.revenuePerAttendeeCents)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            Refunds
                          </p>
                          <p className="text-sm font-medium font-mono text-destructive">
                            {centsToUSD(row.refundedCents)} ({row.refundedOrders})
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            Total Orders
                          </p>
                          <p className="text-sm font-medium">{row.orders} orders</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            Checked-In
                          </p>
                          <p className="text-sm font-medium text-success">
                            {row.checkedIn} attendees
                          </p>
                        </div>
                      </div>

                      {eventItems.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/20">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            Item Breakdown for this Event
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {eventItems.map((item) => (
                              <div
                                key={`${item.eventTicketTypesId}-${item.label}`}
                                className="rounded-lg border border-border/60 bg-background/80 p-3 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-foreground truncate">{item.label}</span>
                                  <Badge variant={item.itemKind === 'table' ? 'voltage' : 'neutral'} className="text-[10px] h-4">
                                    {item.itemKind === 'table' ? 'Table' : 'Ticket'}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground pt-1">
                                  <span>{item.quantitySold} sold @ {centsToUSD(item.priceCents)}</span>
                                  <span className="font-bold text-foreground font-mono">{centsToUSD(item.revenueCents)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
