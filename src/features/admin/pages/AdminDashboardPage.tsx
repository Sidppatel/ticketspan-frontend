import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  DollarSign,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Ticket,
  Users,
} from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { useAuth } from '@/shared/auth/useAuth';
import { getAdminDashboard, getDashboardEvents } from '@/features/admin/services/adminService';
import { listBookings } from '@/features/admin/services/bookingAdminService';
import { buildGreeting, toDashboardCards, upcomingWeek } from '@/features/admin/lib/dashboardInsights';
import { DashboardEventCard } from '@/features/admin/components/DashboardEventCard';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { centsToUSD } from '@/shared/lib/format';

export function AdminDashboardPage() {
  const { user } = useAuth();

  const dashLoader = useCallback(() => getAdminDashboard(), []);
  const { data, loading, error } = useAsync(dashLoader);

  const eventsLoader = useCallback(() => getDashboardEvents(), []);
  const { data: eventEntries, loading: eventsLoading } = useAsync(eventsLoader);

  const bookingsLoader = useCallback(() => listBookings('', 'Paid'), []);
  const { data: bookings, loading: bookingsLoading } = useAsync(bookingsLoader);

  const now = useMemo(() => new Date(), []);
  const greeting = buildGreeting(user?.firstName ?? '', data?.activeEvents ?? 0, data?.totalAttendees ?? 0, now);
  const cards = useMemo(() => toDashboardCards(eventEntries ?? [], now), [eventEntries, now]);
  const upcoming = useMemo(() => upcomingWeek(cards, now), [cards, now]);
  const recent = (bookings ?? []).slice(0, 6);
  const hasEvents = cards.length > 0;

  return (
    <div className="space-y-10 pb-4">
      <section className="relative overflow-hidden rounded-2xl border border-hairline bg-stage text-on-stage shadow-[var(--shadow-e2)]">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute right-24 top-10 h-32 w-32 rounded-full bg-marigold/20 blur-2xl" />
        <div className="relative flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between md:p-9">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-on-stage-soft">
              {greeting.phase === 'evening' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              Your control room
            </span>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              {greeting.title}
            </h1>
            <p className="max-w-xl text-sm text-on-stage-soft md:text-base">{greeting.blurb}</p>
          </div>
          <Link to="/events/new" className="shrink-0">
            <Button size="lg" className="w-full md:w-auto">
              <Plus /> Create event
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => <StatSkeleton key={i} />)
        ) : data ? (
          <>
            <Stat icon={<DollarSign />} label="Total revenue" value={centsToUSD(data.totalRevenueCents)} />
            <Stat icon={<Users />} label="Attendees registered" value={data.totalAttendees.toLocaleString()} />
            <Stat icon={<Activity />} label="Active events" value={data.activeEvents} />
            <Stat icon={<CalendarDays />} label="Total events" value={data.totalEvents} />
          </>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Your events</h2>
            <p className="text-sm text-ink-soft">Everything you're running, sorted by what needs you first.</p>
          </div>
          <Link to="/events" className="hidden text-sm font-medium text-brand hover:underline md:inline">
            Manage all →
          </Link>
        </div>

        {eventsLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : hasEvents ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((vm) => (
              <DashboardEventCard key={vm.eventsId} vm={vm} />
            ))}
            <CreateEventCard />
          </div>
        ) : (
          <EmptyEvents />
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline p-5">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
              <CalendarDays className="h-4.5 w-4.5 text-brand" /> Your upcoming week
            </h3>
            <Link to="/events" className="text-xs font-medium text-brand hover:underline">
              Calendar
            </Link>
          </div>
          <CardContent className="p-0">
            {eventsLoading ? (
              <ListSkeleton />
            ) : upcoming.length > 0 ? (
              <ul className="divide-y divide-hairline">
                {upcoming.map((item) => (
                  <li key={item.eventsId}>
                    <Link
                      to={`/events/${item.eventsId}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-sunken"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-ink-soft">{item.soldLabel}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-foreground">{item.dateLabel}</p>
                        <p className="text-xs text-brand">{item.timingLabel}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-sm text-ink-soft">
                Nothing on the calendar for the next 7 days. A calm week — enjoy it.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline p-5">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
              <Sparkles className="h-4.5 w-4.5 text-marigold" /> Recent activity
            </h3>
            <Link to="/bookings" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          <CardContent className="p-0">
            {bookingsLoading ? (
              <ListSkeleton />
            ) : recent.length > 0 ? (
              <ul className="divide-y divide-hairline">
                {recent.map((b) => (
                  <li key={b.bookingsId} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        New booking · {b.eventTitle || `#${b.bookingNumber}`}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {b.seatsReserved} {b.seatsReserved === 1 ? 'seat' : 'seats'} · {centsToUSD(b.subtotalCents)}
                      </p>
                    </div>
                    <Badge variant={b.status === 'Paid' ? 'success' : b.status === 'Cancelled' ? 'neutral' : 'warn'}>
                      {b.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-sm text-ink-soft">No bookings yet — they'll show up here the moment they land.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card className="transition-colors hover:border-hairline-strong">
      <CardContent className="space-y-3 p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand [&_svg]:size-4.5">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground md:text-3xl">
            {value}
          </p>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
        <div className="h-7 w-20 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function CreateEventCard() {
  return (
    <Link
      to="/events/new"
      className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-hairline-strong p-6 text-center transition-colors duration-[180ms] hover:border-brand hover:bg-brand/[0.03]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand transition-transform duration-[180ms] ease-[var(--ease-spring)] group-hover:scale-110">
          <Plus className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold text-foreground">Create your next event</p>
          <p className="text-sm text-ink-soft">Title, date, tickets — you'll be selling in minutes.</p>
        </div>
      </div>
    </Link>
  );
}

function EmptyEvents() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Ticket className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">No events yet</h3>
          <p className="max-w-md text-sm text-ink-soft">
            This is where your events will live. Creating the first one takes a couple of minutes — add a title and
            date, set your ticket prices, and publish.
          </p>
        </div>
        <Link to="/events/new">
          <Button size="lg">
            <Plus /> Create your first event <ArrowRight />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-hairline">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-5 py-3.5">
          <div className="space-y-2">
            <div className="h-4 w-44 animate-pulse rounded bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
