import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listMyBookings } from '@/features/public/services/publicEventService';
import { listTickets, claimTicketSelf } from '@/features/public/services/ticketService';
import { formatEventDate, centsToUSD } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
  Search,
  CalendarCheck2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Receipt,
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle2,
  Users,
} from 'lucide-react';
import type { Booking } from '@/shared/proto/bookings';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';

type FilterTab = 'all' | 'unclaimed' | 'completed';

export function BookingsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [claimingBookingId, setClaimingBookingId] = useState<string | null>(null);

  const bookingsLoader = useCallback(
    () => listMyBookings({ status: 'Paid', search }),
    [search],
  );
  const { data: bookings, loading, error, reload } = useAsync(bookingsLoader);

  // Quick 1-click self-claim from booking card
  const handleQuickClaimSelf = async (booking: Booking, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (claimingBookingId) return;
    setClaimingBookingId(booking.bookingsId);

    try {
      const bTickets = await listTickets(booking.bookingsId);
      const unassignedTicket = bTickets.find(
        (t) => t.status === 'Unassigned' || (t.status === 'Invited' && !t.guestUsersId)
      );

      if (!unassignedTicket) {
        toast.error('No unassigned tickets available in this booking to claim.');
        return;
      }

      await claimTicketSelf(unassignedTicket.ticketsId);

      toast.success(`Entry pass claimed for ${booking.eventTitle || 'your event'}!`, {
        description: `Ticket #${unassignedTicket.ticketCode} is now in your tickets.`,
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }

      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to claim ticket.';
      toast.error(msg);
    } finally {
      setClaimingBookingId(null);
    }
  };

  const allBookings = useMemo(() => bookings ?? [], [bookings]);
  const unclaimedCount = useMemo(
    () => allBookings.filter((b) => b.ticketsTotal > 0 && b.ticketsClaimed < b.ticketsTotal).length,
    [allBookings],
  );
  const completedCount = useMemo(
    () => allBookings.filter((b) => b.ticketsTotal > 0 && b.ticketsClaimed >= b.ticketsTotal).length,
    [allBookings],
  );

  const filteredBookings = useMemo(() => {
    if (activeTab === 'unclaimed') {
      return allBookings.filter((b) => b.ticketsTotal > 0 && b.ticketsClaimed < b.ticketsTotal);
    }
    if (activeTab === 'completed') {
      return allBookings.filter((b) => b.ticketsTotal > 0 && b.ticketsClaimed >= b.ticketsTotal);
    }
    return allBookings;
  }, [allBookings, activeTab]);

  return (
    <div className="space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-soft font-semibold">
              Order Ledger
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Your Bookings & Orders
          </h1>
          <p className="text-sm text-ink-soft">
            Paid orders, receipt details, and attendee ticket management.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2 sm:pt-0">
          <Link
            to="/tickets"
            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-surface px-4 py-2 text-xs font-mono font-medium text-ink shadow-sm transition-all hover:bg-surface-hover hover:border-hairline-strong"
          >
            <TicketIcon className="size-3.5 text-ink-soft" />
            Gate Passes
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Segmented Filter Control */}
        <div className="flex rounded-2xl bg-surface-sunken p-1 border border-hairline w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold transition-all',
              activeTab === 'all'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-soft hover:text-ink hover:bg-surface/50',
            )}
          >
            All Orders ({allBookings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unclaimed')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold transition-all',
              activeTab === 'unclaimed'
                ? 'bg-surface text-ink shadow-sm border border-hairline'
                : 'text-ink-soft hover:text-ink hover:bg-surface/50',
            )}
          >
            {unclaimedCount > 0 && <AlertCircle className="size-3 text-stone-500" />}
            Action Required ({unclaimedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={cn(
              'rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold transition-all',
              activeTab === 'completed'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-soft hover:text-ink hover:bg-surface/50',
            )}
          >
            All Claimed ({completedCount})
          </button>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
          className="flex max-w-sm flex-1 gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search event, order #, guest…"
              className="h-9 pl-9 text-xs rounded-xl font-mono"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="h-9 px-3 rounded-xl text-xs font-mono">
            Search
          </Button>
        </form>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const hasUnclaimed = booking.ticketsTotal > 0 && booking.ticketsClaimed < booking.ticketsTotal;
            const isClaiming = claimingBookingId === booking.bookingsId;

            return (
              <div
                key={booking.bookingsId}
                className="group relative overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[var(--shadow-e1)] transition-all duration-300 hover:border-hairline-strong hover:shadow-[var(--shadow-e2)] hover:-translate-y-0.5"
              >
                {/* Booking Header & Main Info */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-soft">
                          Booking #{booking.bookingNumber}
                        </span>
                        <Badge variant="voltage" className="font-mono text-[10px]">
                          {centsToUSD(booking.totalCents)}
                        </Badge>
                      </div>

                      <Link
                        to={`/bookings/${booking.bookingsId}`}
                        className="block font-display text-xl font-semibold text-ink hover:text-brand transition-colors truncate"
                      >
                        {booking.eventTitle || 'Event Reservation'}
                      </Link>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft pt-1">
                        {booking.eventStartDate !== '0' && (
                          <span className="flex items-center gap-1.5 font-mono text-ink">
                            <Calendar className="size-3.5 text-ink-soft shrink-0" />
                            {formatEventDate(booking.eventStartDate)}
                          </span>
                        )}
                        {(booking.venueName || booking.venueAddress) && (
                          <span className="flex items-center gap-1.5 truncate">
                            <MapPin className="size-3.5 text-ink-faint shrink-0" />
                            <span className="truncate">{booking.venueName || booking.venueAddress}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-ink-soft">
                          <TicketIcon className="size-3.5 text-ink-faint shrink-0" />
                          {booking.seatsReserved} seat(s) reserved
                        </span>
                      </div>
                    </div>

                    {/* Status Pill Indicator */}
                    <div className="flex shrink-0 flex-col items-start sm:items-end gap-1.5">
                      {hasUnclaimed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken border border-hairline px-3 py-1 font-mono text-xs font-medium text-ink-soft">
                          <AlertCircle className="size-3 text-stone-500" />
                          Passes Available to Claim
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken border border-hairline px-3 py-1 font-mono text-xs font-medium text-ink-soft">
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" /> All {booking.ticketsTotal} Passes Assigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1-Click Fast Claim for Self Button (if unclaimed) */}
                      {hasUnclaimed && (
                        <Button
                          size="sm"
                          disabled={isClaiming}
                          onClick={(e) => handleQuickClaimSelf(booking, e)}
                          className="h-8 gap-1.5 rounded-xl bg-ink text-surface hover:bg-ink/90 dark:bg-white dark:text-black font-semibold text-xs ticketspan-spring-btn shadow-sm"
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" /> Claiming…
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-3.5 fill-current opacity-80" /> Claim 1 for Myself
                            </>
                          )}
                        </Button>
                      )}

                      <Link
                        to={`/bookings/${booking.bookingsId}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-surface-sunken px-3 py-1.5 text-xs font-mono font-medium text-ink-soft hover:text-ink hover:border-hairline-strong transition-all"
                      >
                        <Users className="size-3.5 text-ink-soft" />
                        Manage / Invite Guests
                      </Link>
                    </div>

                    <Link
                      to={`/bookings/${booking.bookingsId}`}
                      className="inline-flex items-center gap-1 font-mono text-xs font-medium text-ink-soft hover:text-ink transition-colors"
                    >
                      <Receipt className="size-3.5" /> Order Receipt & Tickets <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="space-y-3 rounded-3xl border border-dashed border-hairline-strong py-16 text-center">
          <CalendarCheck2 className="mx-auto size-8 stroke-1 text-ink-faint" />
          <p className="font-display text-lg font-semibold text-ink">
            {search
              ? 'No bookings match your search'
              : activeTab === 'unclaimed'
                ? 'No unclaimed orders — all passes assigned!'
                : 'No paid bookings yet'}
          </p>
          <p className="text-sm text-ink-soft max-w-sm mx-auto">
            {search
              ? 'Try searching with a different keyword, booking number, or guest name.'
              : 'Completed ticket purchases and table reservations will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
}
