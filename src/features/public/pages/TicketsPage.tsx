import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listMyTickets, listTickets, claimTicketSelf, selfCheckInTicket } from '@/features/public/services/ticketService';
import { listMyBookings } from '@/features/public/services/publicEventService';
import { formatEventDate } from '@/shared/lib/format';
import { createGoogleCalendarUrl } from '@/shared/lib/calendar';
import { Skeleton } from '@/shared/ui/skeleton';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { QrImage } from '@/features/public/components/wallet/QrImage';
import { upcomingLabel, partitionTicketsByUpcoming } from '@/features/public/lib/discover';
import {
  Ticket as TicketIcon,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MapPin,
  QrCode,
  Loader2,
  CalendarPlus,
  Compass,
  Users,
  ShieldCheck,
} from 'lucide-react';
import type { Ticket, Booking } from '@/shared/proto/bookings';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';

interface ActiveQr {
  qrToken: string;
  label: string;
  bookingNumber?: string;
  eventTitle?: string;
  seatNumber?: number;
  ticketCode?: string;
}

export function TicketsPage() {
  const ticketsLoader = useCallback(() => listMyTickets(), []);
  const { data: tickets, loading: ticketsLoading, error: ticketsError, reload: reloadTickets } = useAsync(ticketsLoader);

  const bookingsLoader = useCallback(() => listMyBookings({ status: 'Paid' }), []);
  const { data: bookings, loading: bookingsLoading, reload: reloadBookings } = useAsync(bookingsLoader);

  const [activeQr, setActiveQr] = useState<ActiveQr | null>(null);
  const [claimingBookingId, setClaimingBookingId] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Unclaimed bookings that require action from the purchaser
  const unclaimedBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b) => b.ticketsTotal > 0 && b.ticketsClaimed < b.ticketsTotal);
  }, [bookings]);

  const { upcoming, previous } = useMemo(
    () => partitionTicketsByUpcoming(tickets ?? []),
    [tickets],
  );

  // 1-Click claim ticket for oneself from an unclaimed booking card
  const handleQuickClaimSelf = async (booking: Booking) => {
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
        description: `Ticket #${unassignedTicket.ticketCode} is now in your gate passes below.`,
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }

      await Promise.all([reloadTickets(), reloadBookings()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to claim ticket. Please try again.';
      toast.error(msg);
    } finally {
      setClaimingBookingId(null);
    }
  };

  const handleSelfCheckIn = async (ticket: Ticket) => {
    if (checkingInId) return;
    setCheckingInId(ticket.ticketsId);

    try {
      const res = await selfCheckInTicket(ticket.ticketsId);
      if (res.valid) {
        toast.success(res.message || `Checked in to ${ticket.eventTitle}!`);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 30, 40]);
        }
        await reloadTickets();
      } else {
        toast.error(res.message || 'Check-in failed. Please present your QR code at the door.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-in error. Present pass QR at entrance.';
      toast.error(msg);
    } finally {
      setCheckingInId(null);
    }
  };

  const hasTickets = (tickets ?? []).length > 0;
  const hasUnclaimed = unclaimedBookings.length > 0;

  return (
    <div className="space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink font-semibold">
              Gate Ready Passes
            </span>
            <span className="inline-flex size-2 rounded-full bg-emerald-600 animate-pulse" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Your Tickets & Passes
          </h1>
          <p className="text-sm text-ink-soft">
            Scan your live QR code at the door for entry, or claim and manage your group tickets.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2 sm:pt-0">
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-surface px-4 py-2 text-xs font-mono font-semibold text-ink shadow-2xs transition-all hover:bg-surface-hover hover:border-stone-400"
          >
            <Users className="size-3.5 text-stone-700" />
            All Bookings ({bookings?.length ?? 0})
          </Link>
        </div>
      </div>

      {ticketsError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {ticketsError}
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* ACTION REQUIRED: UNCLAIMED BOOKINGS SECTION                              */}
      {/* ========================================================================= */}
      {!bookingsLoading && hasUnclaimed && (
        <section aria-labelledby="unclaimed-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink">
              <span className="inline-flex items-center justify-center size-6 rounded-full bg-amber-100 border border-amber-300 text-amber-800 shrink-0">
                <AlertTriangle className="size-3.5" />
              </span>
              <h2 id="unclaimed-heading" className="font-display text-lg sm:text-xl font-bold text-ink">
                Action Required: Unclaimed Tickets ({unclaimedBookings.length})
              </h2>
            </div>
            <span className="font-mono text-xs text-ink-soft">
              Needs your action to generate entry passes
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {unclaimedBookings.map((b) => {
              const unclaimedCount = b.ticketsTotal - b.ticketsClaimed;
              const isClaiming = claimingBookingId === b.bookingsId;

              return (
                <div
                  key={b.bookingsId}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-300/90 bg-surface p-5 sm:p-6 shadow-sm transition-all hover:border-stone-400 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                          Booking #{b.bookingNumber}
                        </span>
                        <h3 className="truncate font-display text-xl font-bold text-ink">
                          {b.eventTitle || 'Event Reservation'}
                        </h3>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 font-mono text-[11px] font-bold text-amber-900 shadow-2xs">
                        ⚠️ {unclaimedCount} of {b.ticketsTotal} Unclaimed
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-ink-soft">
                      {b.eventStartDate !== '0' && (
                        <p className="flex items-center gap-2 font-medium">
                          <Calendar className="size-3.5 text-stone-700 shrink-0" />
                          <span>{formatEventDate(b.eventStartDate)}</span>
                        </p>
                      )}
                      {(b.venueName || b.venueAddress) && (
                        <p className="flex items-center gap-2 truncate">
                          <MapPin className="size-3.5 text-stone-500 shrink-0" />
                          <span className="truncate">{b.venueName || b.venueAddress}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-hairline pt-4">
                    {/* 1-Click Fast Claim for Self Button */}
                    <button
                      type="button"
                      disabled={isClaiming}
                      onClick={() => handleQuickClaimSelf(b)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white px-4 py-2 text-xs font-semibold shadow-sm transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" /> Claiming…
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 fill-current opacity-90" /> Claim 1 Pass for Myself
                        </>
                      )}
                    </button>

                    {/* Manage & Invite Guests Link */}
                    <Link
                      to={`/bookings/${b.bookingsId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 dark:bg-stone-800 dark:border-stone-700 dark:hover:bg-stone-700 px-3.5 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 shadow-2xs transition-all"
                    >
                      <Users className="size-3.5 text-stone-600" />
                      Assign / Invite Guests <ArrowRight className="size-3 text-stone-500" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* GATE READY PASSES (CLAIMED TICKETS)                                      */}
      {/* ========================================================================= */}
      {ticketsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded-md" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : !hasTickets && !hasUnclaimed ? (
        /* Completely Empty State */
        <div className="rounded-3xl border border-dashed border-stone-300 bg-surface/40 p-12 text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-surface-sunken text-stone-500 shadow-inner">
            <TicketIcon className="size-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-ink">No Tickets in Wallet</h2>
            <p className="mx-auto max-w-sm text-sm text-ink-soft">
              When you purchase or claim tickets to live events, your QR entry passes will appear right here.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 px-5 py-2.5 font-mono text-xs font-semibold shadow-md transition-all hover:opacity-90 active:scale-98"
          >
            <Compass className="size-4" /> Discover Events
          </Link>
        </div>
      ) : !hasTickets && hasUnclaimed ? (
        /* Has Unclaimed Orders State */
        <div className="rounded-3xl border border-dashed border-stone-300 bg-surface/30 p-8 text-center space-y-3">
          <p className="font-display text-lg font-bold text-ink">No Active Passes Ready Yet</p>
          <p className="text-sm text-ink-soft max-w-md mx-auto">
            Click <strong>"Claim 1 Pass for Myself"</strong> on your orders above to activate your entry pass with a live QR code.
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming Gate Passes */}
          {upcoming.length > 0 && (
            <section aria-labelledby="upcoming-heading" className="space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2.5">
                  <h2 id="upcoming-heading" className="font-display text-2xl font-bold text-ink">
                    Upcoming Passes ({upcoming.length})
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-950">
                    <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" /> Active
                  </span>
                </div>
                <span className="font-mono text-xs text-ink-soft font-medium">Tap QR to scan at gate</span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {upcoming.map((ticket) => (
                  <TicketPassCard
                    key={ticket.ticketsId}
                    ticket={ticket}
                    highlight
                    onShowQr={setActiveQr}
                    onSelfCheckIn={handleSelfCheckIn}
                    checkingIn={checkingInId === ticket.ticketsId}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Previous / Past Tickets */}
          {previous.length > 0 && (
            <section aria-labelledby="previous-heading" className="space-y-4 pt-6">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <h2 id="previous-heading" className="font-display text-xl font-semibold text-ink opacity-80">
                  Previous Passes ({previous.length})
                </h2>
                <span className="font-mono text-xs text-ink-faint">Past Events</span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {previous.map((ticket) => (
                  <TicketPassCard
                    key={ticket.ticketsId}
                    ticket={ticket}
                    highlight={false}
                    onShowQr={setActiveQr}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* QR ZOOM PASS DIALOG                                                      */}
      {/* ========================================================================= */}
      <Dialog
        open={activeQr !== null}
        onOpenChange={(open) => {
          if (!open) setActiveQr(null);
        }}
      >
        <DialogContent className="flex max-w-sm sm:max-w-md flex-col items-center space-y-4 rounded-3xl p-6 sm:p-8 bg-surface border border-stone-300 shadow-2xl">
          <DialogTitle className="text-center font-display text-2xl font-bold text-ink">
            Entry Pass QR
          </DialogTitle>

          {activeQr && (
            <>
              {/* Ultra High Contrast QR Presentation */}
              <div className="relative rounded-2xl border-2 border-stone-300 bg-white p-5 shadow-xl">
                <QrImage value={activeQr.qrToken} size={240} className="size-[220px] sm:size-[240px] object-contain" />
              </div>

              {/* Scan Reminder & Details */}
              <div className="space-y-2 text-center w-full">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-mono font-bold text-emerald-950">
                  <ShieldCheck className="size-3.5 text-emerald-700" /> Present to Scanner at Gate
                </div>

                <p className="font-display text-lg font-bold text-ink line-clamp-1">
                  {activeQr.eventTitle || activeQr.label}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-ink-soft">
                  {activeQr.ticketCode && (
                    <span className="rounded-md bg-stone-100 border border-stone-300 px-2 py-0.5 text-stone-900 font-bold">
                      #{activeQr.ticketCode}
                    </span>
                  )}
                  {activeQr.seatNumber ? (
                    <span className="rounded-md bg-stone-100 border border-stone-300 px-2 py-0.5 text-stone-900 font-medium">
                      Seat {activeQr.seatNumber}
                    </span>
                  ) : null}
                  {activeQr.bookingNumber && (
                    <span className="rounded-md bg-stone-100 border border-stone-300 px-2 py-0.5 text-stone-700">
                      Order #{activeQr.bookingNumber}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-ink-soft pt-2">
                  Tip: Turn up your screen brightness if scanning under bright sunlight.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-xl text-xs font-mono font-bold border-stone-300"
                onClick={() => setActiveQr(null)}
              >
                Close Pass
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// TICKET PASS CARD COMPONENT
// =============================================================================
function TicketPassCard({
  ticket,
  highlight = false,
  onShowQr,
  onSelfCheckIn,
  checkingIn = false,
}: {
  ticket: Ticket;
  highlight?: boolean;
  onShowQr: (qr: ActiveQr) => void;
  onSelfCheckIn?: (ticket: Ticket) => void;
  checkingIn?: boolean;
}) {
  const isCheckedIn = ticket.status === 'CheckedIn';
  const calendarUrl = useMemo(
    () =>
      createGoogleCalendarUrl({
        title: ticket.eventTitle || 'Event',
        startEpoch: ticket.eventStartDate,
        venue: ticket.venueName,
      }),
    [ticket.eventTitle, ticket.eventStartDate, ticket.venueName],
  );

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-surface p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md',
        highlight
          ? 'border-stone-300/90 hover:border-stone-400'
          : 'border-hairline opacity-85 hover:opacity-100',
      )}
    >
      {/* Pass Top Bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* High Contrast Ticket Type Badge (Crisp White text on Dark) */}
            <span className="inline-flex items-center rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 shadow-2xs">
              {ticket.ticketTypeLabel || 'STANDARD'}
            </span>

            {isCheckedIn ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-950 font-mono text-[11px] font-bold px-2 py-0.5">
                <CheckCircle2 className="size-3 text-emerald-700" /> Checked In
              </span>
            ) : null}

            {upcomingLabel(ticket.eventStartDate) && !isCheckedIn ? (
              <span className="inline-flex items-center rounded-md bg-stone-100 border border-stone-300 text-stone-800 font-mono text-[11px] font-semibold px-2 py-0.5">
                {upcomingLabel(ticket.eventStartDate)}
              </span>
            ) : null}
          </div>

          <Link
            to={`/events/${ticket.eventSlug}`}
            className="block font-display text-xl sm:text-2xl font-bold text-ink hover:text-stone-700 transition-colors line-clamp-1"
          >
            {ticket.eventTitle}
          </Link>

          <div className="space-y-1 text-xs text-ink-soft">
            <p className="flex items-center gap-2 font-mono text-ink font-semibold">
              <Calendar className="size-3.5 text-stone-700 shrink-0" />
              <span>{formatEventDate(ticket.eventStartDate)}</span>
            </p>
            {ticket.venueName && (
              <p className="flex items-center gap-2 truncate">
                <MapPin className="size-3.5 text-stone-500 shrink-0" />
                <span className="truncate">{ticket.venueName}</span>
              </p>
            )}
          </div>
        </div>

        {/* QR Code Quick Button */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          {ticket.qrToken ? (
            <button
              type="button"
              onClick={() =>
                onShowQr({
                  qrToken: ticket.qrToken,
                  label: `${ticket.ticketTypeLabel || 'Entry'} (${ticket.ticketCode})`,
                  bookingNumber: ticket.bookingNumber,
                  eventTitle: ticket.eventTitle,
                  seatNumber: ticket.seatNumber,
                  ticketCode: ticket.ticketCode,
                })
              }
              className="group/qr flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-stone-300 bg-white p-2.5 shadow-2xs transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
              aria-label="Enlarge QR code"
            >
              <QrImage value={ticket.qrToken} size={90} className="size-[80px] sm:size-[90px] object-contain" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-700 group-hover/qr:text-stone-950 transition-colors">
                Enlarge QR
              </span>
            </button>
          ) : (
            <span className="rounded-xl border border-hairline bg-surface-sunken p-4 text-xs font-mono text-ink-faint">
              No QR
            </span>
          )}
        </div>
      </div>

      {/* Pass Footer Strip */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3 text-xs">
        <div className="flex items-center gap-2 font-mono">
          <span className="rounded-md bg-stone-100 border border-stone-300 px-2.5 py-1 font-bold text-stone-900">
            #{ticket.ticketCode}
          </span>
          {ticket.seatNumber > 0 ? (
            <span className="rounded-md bg-stone-100 border border-stone-300 px-2 py-1 text-stone-700 font-medium">
              Seat {ticket.seatNumber}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {calendarUrl && !isCheckedIn && (
            <a
              href={calendarUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-950 font-mono text-xs font-semibold transition-colors"
              title="Add to Google Calendar"
            >
              <CalendarPlus className="size-3.5 text-stone-700" /> Add to Cal
            </a>
          )}

          {onSelfCheckIn && !isCheckedIn && (
            <Button
              size="sm"
              variant="outline"
              disabled={checkingIn}
              onClick={() => onSelfCheckIn(ticket)}
              className="h-8 px-3 rounded-xl text-xs font-mono font-bold text-stone-900 border-stone-300 bg-white hover:bg-stone-50 shadow-2xs"
            >
              {checkingIn ? <Loader2 className="size-3 animate-spin mr-1" /> : <QrCode className="size-3.5 mr-1" />}
              Self Check-In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
