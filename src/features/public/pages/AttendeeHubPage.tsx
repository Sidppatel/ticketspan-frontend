import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/shared/auth/useAuth';
import { useAsync } from '@/shared/hooks/useAsync';
import { listMyTickets } from '@/features/public/services/ticketService';
import { listMyBookings, listPublicEvents } from '@/features/public/services/publicEventService';
import { tenantClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import { tenantUrl } from '@/shared/subdomain';
import { formatEventDate } from '@/shared/lib/format';
import { partitionTicketsByUpcoming } from '@/features/public/lib/discover';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { QrImage } from '@/features/public/components/wallet/QrImage';
import { imageUrl } from '@/shared/upload';
import {
  Ticket as TicketIcon,
  Calendar,
  Building2,
  QrCode,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Receipt,
  LogOut,
  MapPin,
  Compass,
} from 'lucide-react';
import type { PublicTenant } from '@/shared/proto/tenant';
import type { Event } from '@/shared/proto/event';

interface ActiveQr {
  qrToken: string;
  label: string;
  bookingNumber?: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Music: 'from-amber-500/20 via-orange-500/10 to-transparent',
  Tech: 'from-blue-500/20 via-indigo-500/10 to-transparent',
  Dining: 'from-emerald-500/20 via-teal-500/10 to-transparent',
  Festivals: 'from-purple-500/20 via-pink-500/10 to-transparent',
  Default: 'from-slate-500/15 via-zinc-500/10 to-transparent',
};

function EventCardItem({ event }: { event: Event }) {
  const categoryKey = event.category || 'Default';
  const gradient = CATEGORY_GRADIENTS[categoryKey] || CATEGORY_GRADIENTS.Default;
  const startSec = Number(event.startDate);
  const dateObj = startSec ? new Date(startSec * 1000) : null;
  const monthStr = dateObj ? dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBA';
  const dayStr = dateObj ? dateObj.getDate() : '--';

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-hairline/80 bg-surface shadow-[var(--shadow-e1)] transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[var(--shadow-e2)]"
    >
      {/* Image or Styled Typographic Poster */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-sunken">
        {event.primaryImageId ? (
          <img
            src={imageUrl(event.primaryImageId)}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className={`relative flex h-full w-full flex-col justify-between bg-gradient-to-br ${gradient} p-5`}>
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-hairline bg-surface/80 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-ink backdrop-blur-md">
                {event.category || 'Event'}
              </span>
              <div className="flex size-7 items-center justify-center rounded-full bg-surface/80 text-ink-soft shadow-sm backdrop-blur-md">
                <Compass className="size-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-display text-xl font-semibold leading-tight text-ink line-clamp-2">
                {event.title}
              </p>
            </div>
          </div>
        )}

        {/* Floating Date Badge */}
        {dateObj && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-hairline/60 bg-surface/90 px-3 py-1.5 shadow-md backdrop-blur-md">
            <div className="text-center font-mono">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-brand">{monthStr}</span>
              <span className="block text-sm font-semibold leading-none text-ink">{dayStr}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 font-mono text-[10px] font-medium text-ink-soft">
              {event.category || event.eventType || 'Event'}
            </span>
            <p className="font-mono text-xs text-brand font-medium">
              {formatEventDate(event.startDate)}
            </p>
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug text-ink line-clamp-2 transition-colors group-hover:text-brand">
            {event.title}
          </h3>
        </div>

        <div className="flex items-center justify-between border-t border-hairline pt-4 text-xs font-medium text-brand">
          <span className="font-mono text-[11px] uppercase tracking-wider">Book Tickets</span>
          <div className="flex size-7 items-center justify-center rounded-full bg-surface-sunken group-hover:bg-brand group-hover:text-white transition-all duration-200 group-hover:translate-x-0.5">
            <ArrowUpRight className="size-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function AttendeeHubPage() {
  const { user, logout } = useAuth();
  const [activeQr, setActiveQr] = useState<ActiveQr | null>(null);

  const ticketsLoader = useCallback(() => listMyTickets(), []);
  const { data: tickets, loading: ticketsLoading } = useAsync(ticketsLoader);

  const bookingsLoader = useCallback(() => listMyBookings({ status: 'Paid' }), []);
  const { data: bookings } = useAsync(bookingsLoader);

  const eventsLoader = useCallback(() => listPublicEvents(''), []);
  const { data: events, loading: eventsLoading } = useAsync(eventsLoader);

  const tenantsLoader = useCallback(async () => {
    try {
      const res = await callRpc(() => tenantClient.listPublicTenants({}));
      return res.tenants;
    } catch {
      return [] as PublicTenant[];
    }
  }, []);
  const { data: tenants, loading: tenantsLoading } = useAsync(tenantsLoader);

  const upcomingTickets = useMemo(() => {
    if (!tickets) return [];
    return partitionTicketsByUpcoming(tickets).upcoming;
  }, [tickets]);

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Attendee';

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-8 space-y-16 pb-28">
      {/* Double-Bezel Hero Header */}
      <div className="rounded-[2.5rem] bg-black/5 p-2 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
        <section className="relative overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#0d1017] p-8 text-white shadow-2xl sm:p-12">
          {/* Ambient Lighting Gradients */}
          <div
            className="pointer-events-none absolute -left-24 -top-24 size-[400px] rounded-full bg-emerald-500/15 blur-[100px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 size-[400px] rounded-full bg-amber-500/10 blur-[120px]"
            aria-hidden="true"
          />

          {/* Geometric Grid */}
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.2em] text-emerald-400">
                  <Sparkles className="size-3" /> Universal Identity
                </span>
                <span className="font-mono text-xs text-slate-400">{user?.email}</span>
              </div>

              <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Welcome back, <em className="font-normal italic text-emerald-400">{firstName}</em>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-slate-300/80">
                Your single universal wallet for passes, table reservations, and receipts across all partner box offices.
              </p>
            </div>

            {/* Quick Stats Bento */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link
                to="/tickets"
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex items-center justify-between text-slate-400 transition-colors group-hover:text-emerald-400">
                  <TicketIcon className="size-5" />
                  <ArrowUpRight className="size-4 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
                <div className="mt-3">
                  <p className="font-display text-2xl font-semibold text-white">{tickets?.length ?? 0}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-slate-400">My Passes</p>
                </div>
              </Link>

              <Link
                to="/bookings"
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex items-center justify-between text-slate-400 transition-colors group-hover:text-amber-400">
                  <Receipt className="size-5" />
                  <ArrowUpRight className="size-4 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
                <div className="mt-3">
                  <p className="font-display text-2xl font-semibold text-white">{bookings?.length ?? 0}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-slate-400">Orders</p>
                </div>
              </Link>

              <div className="col-span-2 flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:col-span-1">
                <div className="flex items-center justify-between text-slate-400">
                  <Building2 className="size-5" />
                  <button
                    type="button"
                    onClick={logout}
                    className="text-slate-400 transition-colors hover:text-white"
                    title="Sign out"
                  >
                    <LogOut className="size-4" />
                  </button>
                </div>
                <div className="mt-3">
                  <p className="font-display text-2xl font-semibold text-white">{tenants?.length ?? 0}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-slate-400">Box Offices</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Upcoming Passes Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-hairline pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
              Gate Ready Passes
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Upcoming Tickets</h2>
          </div>
          <Link
            to="/tickets"
            className="group flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider text-brand hover:underline"
          >
            Full Wallet ({tickets?.length ?? 0})
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {ticketsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-[1.75rem]" />
            ))}
          </div>
        ) : upcomingTickets.length === 0 ? (
          <div className="rounded-[2rem] border border-hairline/80 bg-surface/60 p-8 text-center backdrop-blur-sm sm:p-12">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-sunken text-ink-soft">
              <TicketIcon className="size-7 stroke-[1.5]" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">No Active Entry Passes</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
              When you book tickets with any partner box office, your live QR passes will appear here ready for door scan.
            </p>
            <a
              href="#box-offices"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 font-mono text-xs font-medium text-white shadow-md transition-transform active:scale-95 hover:opacity-90"
            >
              Explore Partner Box Offices <ArrowRight className="size-3.5" />
            </a>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTickets.slice(0, 3).map((ticket) => (
              <div
                key={ticket.ticketsId}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-brand/30 bg-surface p-6 shadow-[var(--shadow-e1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-e2)]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate font-display text-lg font-semibold text-ink">
                      {ticket.eventTitle}
                    </span>
                    <Badge variant="voltage">{ticket.ticketTypeLabel || 'General'}</Badge>
                  </div>

                  <p className="flex items-center gap-2 text-xs text-ink-soft">
                    <Calendar className="size-3.5 text-brand" />
                    {formatEventDate(ticket.eventStartDate)}
                  </p>

                  {ticket.venueName ? (
                    <p className="flex items-center gap-2 text-xs text-ink-soft">
                      <MapPin className="size-3.5 text-ink-faint" />
                      {ticket.venueName}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4">
                  <span className="font-mono text-xs font-medium text-ink">
                    Seat {ticket.seatNumber || 'GA'} · #{ticket.ticketCode}
                  </span>
                  {ticket.qrToken ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 rounded-full text-xs"
                      onClick={() =>
                        setActiveQr({
                          qrToken: ticket.qrToken,
                          label: `${ticket.ticketTypeLabel || 'General'} (${ticket.ticketCode})`,
                          bookingNumber: ticket.bookingNumber,
                        })
                      }
                    >
                      <QrCode className="size-3.5 text-brand" /> Show QR
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Explore Partner Box Offices */}
      <section id="box-offices" className="space-y-6">
        <div className="flex items-end justify-between border-b border-hairline pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
              Directory · Instant Access
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Partner Box Offices</h2>
          </div>
          <span className="font-mono text-xs text-ink-soft">
            {tenants?.length ?? 0} active organizers
          </span>
        </div>

        {tenantsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-[1.75rem]" />
            ))}
          </div>
        ) : (tenants ?? []).length === 0 ? (
          <div className="rounded-[2rem] border border-hairline bg-surface p-8 text-center text-sm text-ink-soft">
            No public organizers listed yet.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(tenants ?? []).map((t) => (
              <a
                key={t.slug}
                href={tenantUrl(t.slug)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-hairline/80 bg-surface/80 p-6 shadow-[var(--shadow-e1)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[var(--shadow-e2)]"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-surface-sunken text-ink ring-1 ring-hairline transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                      <Building2 className="size-6 stroke-[1.5]" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="size-1.5 rounded-full bg-emerald-500" /> Active Box Office
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink transition-colors group-hover:text-brand">
                      {t.name}
                    </h3>
                    <p className="mt-0.5 font-mono text-xs text-ink-faint">
                      {t.slug}.ticketspan.com
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4 text-xs font-medium text-brand">
                  <span className="font-mono text-[11px] uppercase tracking-wider">Open Box Office</span>
                  <div className="flex size-7 items-center justify-center rounded-full bg-surface-sunken transition-all duration-200 group-hover:translate-x-0.5 group-hover:bg-brand group-hover:text-white">
                    <ArrowUpRight className="size-3.5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Trending Events Across the Platform */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-hairline pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
              Curated · All Partners
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Trending Experiences</h2>
          </div>
        </div>

        {eventsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-[1.75rem]" />
            ))}
          </div>
        ) : (events ?? []).length === 0 ? (
          <div className="rounded-[2rem] border border-hairline bg-surface p-8 text-center text-sm text-ink-soft">
            No events scheduled right now.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(events ?? []).slice(0, 6).map((ev) => (
              <EventCardItem key={ev.eventsId} event={ev} />
            ))}
          </div>
        )}
      </section>

      {/* Entry Pass QR Modal */}
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
              <div className="rounded-2xl border border-hairline bg-white p-5 shadow-lg">
                <QrImage value={activeQr.qrToken} size={240} />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-xs uppercase tracking-wider text-brand font-mono">Present at Gate</p>
                <p className="font-mono text-base font-semibold text-foreground">
                  {activeQr.label}
                </p>
                {activeQr.bookingNumber && (
                  <p className="font-mono text-xs text-ink-soft">Booking #{activeQr.bookingNumber}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
