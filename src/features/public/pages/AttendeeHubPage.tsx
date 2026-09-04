import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/shared/auth/useAuth';
import { useAsync } from '@/shared/hooks/useAsync';
import { listMyTickets } from '@/features/public/services/ticketService';
import { listMyBookings, listPublicEventsPaged } from '@/features/public/services/publicEventService';
import { tenantClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import { tenantUrl, getUniversalLoginUrl } from '@/shared/subdomain';
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
  Search,
  SlidersHorizontal,
  X,
  LogIn,
  ChevronDown,
  Loader2,
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
  Social: 'from-cyan-500/20 via-sky-500/10 to-transparent',
  Business: 'from-indigo-500/20 via-violet-500/10 to-transparent',
  Default: 'from-slate-500/15 via-zinc-500/10 to-transparent',
};

const POPULAR_CATEGORIES = ['Music', 'Festivals', 'Dining', 'Tech', 'Social', 'Business'];

type DateFilterOption = 'all' | 'today' | 'weekend' | 'month';

function EventCardItem({ event }: { event: Event }) {
  const [imgError, setImgError] = useState(false);
  const categoryKey = event.category || 'Default';
  const gradient = CATEGORY_GRADIENTS[categoryKey] || CATEGORY_GRADIENTS.Default;
  const startSec = Number(event.startDate);
  const dateObj = startSec ? new Date(startSec * 1000) : null;
  const monthStr = dateObj ? dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBA';
  const dayStr = dateObj ? dateObj.getDate() : '--';

  const organizerSlug = event.tenantSlug;
  const organizerName = event.tenantName || (organizerSlug ? `@${organizerSlug}` : 'Box Office');
  const targetUrl = organizerSlug
    ? tenantUrl(organizerSlug, `events/${event.slug}`)
    : `/events/${event.slug}`;

  const hasValidImage = Boolean(event.primaryImageId && !imgError);

  return (
    <a
      href={targetUrl}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-hairline/80 bg-surface shadow-[var(--shadow-e1)] transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[var(--shadow-e2)] active:scale-[0.99]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-sunken">
        {hasValidImage ? (
          <img
            src={imageUrl(event.primaryImageId)}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
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

        {dateObj && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-hairline/60 bg-surface/90 px-3 py-1.5 shadow-md backdrop-blur-md">
            <div className="text-center font-mono">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-brand">{monthStr}</span>
              <span className="block text-sm font-semibold leading-none text-ink">{dayStr}</span>
            </div>
          </div>
        )}

        {organizerName && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-hairline/60 bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-ink shadow-sm backdrop-blur-md">
            <Building2 className="size-3 text-brand" />
            <span className="max-w-[130px] truncate">{organizerName}</span>
          </div>
        )}
      </div>

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
          {event.shortDescription ? (
            <p className="line-clamp-2 text-xs text-ink-soft">
              {event.shortDescription}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-hairline pt-4 text-xs font-medium text-brand">
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {organizerSlug ? `Book via @${organizerSlug}` : 'Book Tickets'}
          </span>
          <div className="flex size-7 items-center justify-center rounded-full bg-surface-sunken group-hover:bg-brand group-hover:text-white transition-all duration-200 group-hover:translate-x-0.5">
            <ArrowUpRight className="size-3.5" />
          </div>
        </div>
      </div>
    </a>
  );
}

export function AttendeeHubPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const [activeQr, setActiveQr] = useState<ActiveQr | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTenantSlug, setSelectedTenantSlug] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const ticketsLoader = useCallback(() => {
    if (!isAuthenticated) return Promise.resolve([]);
    return listMyTickets();
  }, [isAuthenticated]);
  const { data: tickets, loading: ticketsLoading } = useAsync(ticketsLoader);

  const bookingsLoader = useCallback(() => {
    if (!isAuthenticated) return Promise.resolve([]);
    return listMyBookings({ status: 'Paid' });
  }, [isAuthenticated]);
  const { data: bookings } = useAsync(bookingsLoader);

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

  const fetchPage = useCallback(
    async (offset: number, isAppend: boolean) => {
      if (isAppend) {
        setLoadingMore(true);
      } else {
        setEventsLoading(true);
      }

      try {
        const result = await listPublicEventsPaged({
          offset,
          limit: 15,
          search: debouncedSearch,
          category: selectedCategory,
          tenantSlug: selectedTenantSlug,
          dateFilter,
          upcomingOnly: true,
        });

        if (isAppend) {
          setEvents((prev) => [...prev, ...result.events]);
        } else {
          setEvents(result.events);
        }
        setTotalEvents(result.total);
      } catch {
        if (!isAppend) {
          setEvents([]);
          setTotalEvents(0);
        }
      } finally {
        setEventsLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, selectedCategory, selectedTenantSlug, dateFilter],
  );

  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  const hasMore = events.length < totalEvents;

  useEffect(() => {
    if (!sentinelRef.current) return;
    const currentSentinel = sentinelRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !eventsLoading && !loadingMore) {
          fetchPage(events.length, true);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(currentSentinel);
    return () => observer.disconnect();
  }, [hasMore, eventsLoading, loadingMore, events.length, fetchPage]);

  const hasActiveFilters =
    debouncedSearch !== '' ||
    selectedTenantSlug !== 'all' ||
    dateFilter !== 'all' ||
    selectedCategory !== 'All';

  function resetFilters() {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedTenantSlug('all');
    setDateFilter('all');
    setSelectedCategory('All');
  }

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Attendee';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12 sm:space-y-16 pb-28">
      <div className="rounded-[2.5rem] bg-black/5 p-1.5 sm:p-2 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
        <section className="relative overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#0d1017] p-6 sm:p-10 lg:p-12 text-white shadow-2xl">
          <div
            className="pointer-events-none absolute -left-24 -top-24 size-[400px] rounded-full bg-emerald-500/15 blur-[100px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 size-[400px] rounded-full bg-amber-500/10 blur-[120px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.2em] text-emerald-400">
                  <Sparkles className="size-3" /> TicketSpan Global Hub
                </span>
                {isAuthenticated && (
                  <span className="font-mono text-xs text-slate-400">{user?.email}</span>
                )}
              </div>

              <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {isAuthenticated ? (
                  <>
                    Welcome back, <em className="font-normal italic text-emerald-400">{firstName}</em>
                  </>
                ) : (
                  <>
                    Discover Live <em className="font-normal italic text-emerald-400">Experiences</em>
                  </>
                )}
              </h1>

              <p className="max-w-xl text-sm sm:text-base leading-relaxed text-slate-300/80">
                Explore concerts, festivals, private lounges, and verified partner box offices in one universal directory.
              </p>
            </div>

            {isAuthenticated ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
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
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href={getUniversalLoginUrl('/hub')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 font-display text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95"
                >
                  <LogIn className="size-4" />
                  <span>Sign In / My Tickets</span>
                </a>
              </div>
            )}
          </div>
        </section>
      </div>

      {isAuthenticated && (
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
            <div className="rounded-[2rem] border border-hairline/80 bg-surface/60 p-6 sm:p-10 text-center backdrop-blur-sm">
              <div className="mx-auto flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-surface-sunken text-ink-soft">
                <TicketIcon className="size-6 sm:size-7 stroke-[1.5]" />
              </div>
              <h3 className="mt-4 font-display text-base sm:text-lg font-semibold text-ink">No Active Entry Passes</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-ink-soft">
                When you book tickets with any partner box office, your live QR passes will appear here ready for door scan.
              </p>
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
      )}

      <section id="box-offices" className="space-y-6">
        <div className="flex items-end justify-between border-b border-hairline pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
              Directory · Official Portals
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Partner Box Offices</h2>
          </div>
          <span className="font-mono text-xs text-ink-soft">
            {tenants?.length ?? 0} active organizers
          </span>
        </div>

        {tenantsLoading ? (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-[1.75rem]" />
            ))}
          </div>
        ) : (tenants ?? []).length === 0 ? (
          <div className="rounded-[2rem] border border-hairline bg-surface p-8 text-center text-sm text-ink-soft">
            No public organizers listed yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(tenants ?? []).map((t) => {
              const isCurrentSelected = selectedTenantSlug === t.slug;

              return (
                <div
                  key={t.slug}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border bg-surface/80 p-5 sm:p-6 shadow-[var(--shadow-e1)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-e2)] ${
                    isCurrentSelected ? 'border-brand ring-2 ring-brand/20' : 'border-hairline/80 hover:border-brand/40'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-surface-sunken text-ink ring-1 ring-hairline transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                        <Building2 className="size-5 sm:size-6 stroke-[1.5]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display text-lg sm:text-xl font-semibold text-ink transition-colors group-hover:text-brand">
                        {t.name}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-ink-faint">
                        {t.slug}.ticketspan.com
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-hairline pt-4 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTenantSlug(selectedTenantSlug === t.slug ? 'all' : t.slug);
                        document.getElementById('events-explorer')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="font-mono text-[11px] uppercase tracking-wider text-ink-soft hover:text-brand transition-colors"
                    >
                      {selectedTenantSlug === t.slug ? 'Showing Events ✓' : 'Filter Events'}
                    </button>
                    <a
                      href={tenantUrl(t.slug)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-brand hover:underline"
                    >
                      Visit Storefront <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="events-explorer" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-hairline pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
              Instant Booking · Verified Partner Venues
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {hasActiveFilters ? 'Search & Filter Results' : 'Top Upcoming Events'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand/10 px-3 py-1 font-mono text-xs font-semibold text-brand">
              {eventsLoading ? 'Searching...' : `Showing ${events.length} of ${totalEvents} Upcoming`}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-hairline/80 bg-surface/90 p-4 sm:p-5 shadow-xs backdrop-blur-md space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, organizer, city, or performer..."
              className="w-full rounded-2xl border border-hairline bg-surface-sunken py-3 pl-10 pr-10 text-sm text-ink placeholder:text-ink-soft/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-ink-soft mr-1">
                <SlidersHorizontal className="size-3 text-brand" /> Date:
              </span>
              {(
                [
                  { key: 'all', label: 'All Upcoming' },
                  { key: 'today', label: 'Today' },
                  { key: 'weekend', label: 'This Weekend' },
                  { key: 'month', label: 'Next 30 Days' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDateFilter(tab.key)}
                  className={`rounded-full px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
                    dateFilter === tab.key
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-surface-sunken text-ink-soft hover:text-ink hover:bg-hairline/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={selectedTenantSlug}
                  onChange={(e) => setSelectedTenantSlug(e.target.value)}
                  className="appearance-none rounded-xl border border-hairline bg-surface-sunken py-2 pl-3 pr-8 font-mono text-xs text-ink focus:border-brand focus:outline-none"
                >
                  <option value="all">All Organizers</option>
                  {(tenants ?? []).map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name} (@{t.slug})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-ink-soft" />
              </div>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none rounded-xl border border-hairline bg-surface-sunken py-2 pl-3 pr-8 font-mono text-xs text-ink focus:border-brand focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  {POPULAR_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-ink-soft" />
              </div>

              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={resetFilters}
                  className="h-8 gap-1 px-2.5 font-mono text-xs text-destructive hover:bg-destructive/10"
                >
                  <X className="size-3.5" /> Reset Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {eventsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-[1.75rem]" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-[2rem] border border-hairline bg-surface p-12 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-sunken text-ink-soft">
              <Calendar className="size-6 stroke-[1.5]" />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">No upcoming events found</h3>
            <p className="mx-auto max-w-sm text-sm text-ink-soft">
              Try adjusting your search query, or clearing your date and organizer filters.
            </p>
            {hasActiveFilters && (
              <Button size="sm" variant="outline" onClick={resetFilters} className="mt-2 text-xs">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <EventCardItem key={ev.eventsId} event={ev} />
              ))}
            </div>

            <div ref={sentinelRef} className="h-10 flex items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 font-mono text-xs text-ink-soft py-4">
                  <Loader2 className="size-4 animate-spin text-brand" />
                  <span>Loading more upcoming events...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

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
