import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listMyTickets } from '@/features/public/services/ticketService';
import { listMyBookings } from '@/features/public/services/publicEventService';
import { partitionTicketsByUpcoming } from '@/features/public/lib/discover';
import { formatEventDate } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { QrImage } from '@/features/public/components/wallet/QrImage';
import {
  Ticket as TicketIcon,
  Receipt,
  Calendar,
  MapPin,
  QrCode,
  ArrowUpRight,
  ArrowRight,
  Compass,
} from 'lucide-react';
import type { Ticket } from '@/shared/proto/bookings';
import { SavedPaymentMethodsCard } from './SavedPaymentMethodsCard';

interface ActiveQr {
  qrToken: string;
  label: string;
  bookingNumber?: string;
}

export function ActivityTab() {
  const [activeQr, setActiveQr] = useState<ActiveQr | null>(null);

  const ticketsLoader = useCallback(() => listMyTickets(), []);
  const { data: tickets, loading: ticketsLoading } = useAsync(ticketsLoader);

  const bookingsLoader = useCallback(() => listMyBookings({ status: 'Paid' }), []);
  const { data: bookings } = useAsync(bookingsLoader);

  const upcomingTickets = useMemo(() => {
    if (!tickets) return [];
    return partitionTicketsByUpcoming(tickets).upcoming;
  }, [tickets]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-hairline pb-4">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-brand">
          Live Wallet & Ledger
        </span>
        <h2 className="font-display text-2xl font-semibold text-ink">Ticket Wallet & Order Activity</h2>
        <p className="text-xs text-ink-soft mt-0.5">
          Quick summary of your gate entry passes and recent booking receipts across partner venues.
        </p>
      </div>

      {/* Metric Counters Bento */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link
          to="/tickets"
          className="group relative flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-4 shadow-[var(--shadow-e1)] transition-all duration-300 hover:border-brand/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-e2)]"
        >
          <div className="flex items-center justify-between text-ink-soft transition-colors group-hover:text-brand">
            <TicketIcon className="size-5" />
            <ArrowUpRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4">
            <p className="font-display text-3xl font-bold text-ink">{tickets?.length ?? 0}</p>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">Active Passes</p>
          </div>
        </Link>

        <Link
          to="/bookings"
          className="group relative flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-4 shadow-[var(--shadow-e1)] transition-all duration-300 hover:border-brand/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-e2)]"
        >
          <div className="flex items-center justify-between text-ink-soft transition-colors group-hover:text-amber-500">
            <Receipt className="size-5" />
            <ArrowUpRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4">
            <p className="font-display text-3xl font-bold text-ink">{bookings?.length ?? 0}</p>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">Paid Orders</p>
          </div>
        </Link>

        <Link
          to="/hub"
          className="col-span-2 sm:col-span-1 group relative flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-4 shadow-[var(--shadow-e1)] transition-all duration-300 hover:border-brand/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-e2)]"
        >
          <div className="flex items-center justify-between text-ink-soft transition-colors group-hover:text-emerald-500">
            <Compass className="size-5" />
            <ArrowUpRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4">
            <p className="font-display text-3xl font-bold text-ink">Universal</p>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">Attendee Hub</p>
          </div>
        </Link>
      </div>

      {/* Upcoming Passes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">Upcoming Gate Passes</h3>
          <Link
            to="/tickets"
            className="group flex items-center gap-1 font-mono text-xs text-brand font-medium hover:underline"
          >
            View all passes <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {ticketsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : upcomingTickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline-strong p-8 text-center space-y-2">
            <TicketIcon className="mx-auto size-7 stroke-1 text-ink-faint" />
            <p className="font-display text-sm font-semibold text-ink">No upcoming passes right now</p>
            <p className="text-xs text-ink-soft">
              When you reserve tickets for an event, your passes will show up here.
            </p>
            <Link
              to="/"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 font-mono text-xs font-semibold text-brand-ink hover:opacity-90"
            >
              Browse Events <ArrowRight className="size-3" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingTickets.slice(0, 2).map((ticket: Ticket) => (
              <div
                key={ticket.ticketsId}
                className="group relative flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-5 shadow-[var(--shadow-e1)] transition-all hover:border-brand/40"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="truncate font-display text-base font-semibold text-ink">
                      {ticket.eventTitle}
                    </h4>
                    <Badge variant="voltage" className="font-mono text-[10px]">
                      {ticket.ticketTypeLabel || 'Pass'}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-ink-soft font-mono">
                    <Calendar className="size-3.5 text-brand" />
                    {formatEventDate(ticket.eventStartDate)}
                  </p>
                  {ticket.venueName && (
                    <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                      <MapPin className="size-3.5 text-ink-faint" />
                      {ticket.venueName}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
                  <span className="font-mono text-xs text-ink font-medium">#{ticket.ticketCode}</span>
                  {ticket.qrToken && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 rounded-full text-xs font-mono"
                      onClick={() =>
                        setActiveQr({
                          qrToken: ticket.qrToken,
                          label: `${ticket.ticketTypeLabel || 'Entry'} (${ticket.ticketCode})`,
                          bookingNumber: ticket.bookingNumber,
                        })
                      }
                    >
                      <QrCode className="size-3 text-brand" /> Show QR
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Saved Payment Methods & Vaulted Cards Section */}
      <section className="space-y-4">
        <SavedPaymentMethodsCard />
      </section>

      {/* QR Zoom Modal */}
      <Dialog
        open={activeQr !== null}
        onOpenChange={(open) => {
          if (!open) setActiveQr(null);
        }}
      >
        <DialogContent className="flex max-w-xs flex-col items-center space-y-4 rounded-2xl p-6 md:max-w-md">
          <DialogTitle className="text-center font-display text-xl font-semibold">Live Entry Pass</DialogTitle>
          {activeQr && (
            <>
              <div className="rounded-2xl border border-hairline bg-white p-4 shadow-lg">
                <QrImage value={activeQr.qrToken} size={220} />
              </div>
              <div className="space-y-1 text-center font-mono">
                <p className="text-xs uppercase tracking-wider text-brand">Present at Door</p>
                <p className="text-sm font-semibold text-foreground">{activeQr.label}</p>
                {activeQr.bookingNumber && (
                  <p className="text-xs text-ink-soft">Booking #{activeQr.bookingNumber}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
