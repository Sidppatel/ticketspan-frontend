import { useCallback, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listMyBookings } from '@/features/public/services/publicEventService';
import { hasUnclaimedTickets, claimedSummary } from '@/features/public/lib/discover';
import { formatEventDate } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Search, CalendarCheck2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const NOTCH = { ['--entryvine-notch' as string]: 'var(--background)' } as CSSProperties;

export function BookingsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const bookingsLoader = useCallback(
    () => listMyBookings({ status: 'Paid', search }),
    [search],
  );
  const { data: bookings, loading, error } = useAsync(bookingsLoader);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-semibold text-ink">Your bookings</h1>
        <p className="text-sm text-ink-soft">
          Paid orders with their entry passes; share unclaimed tickets with your guests.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
        }}
        className="flex max-w-lg gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by event, ticket code, or guest…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : (bookings ?? []).length > 0 ? (
        <div className="space-y-3">
          {(bookings ?? []).map((booking) => {
            const unclaimed = hasUnclaimedTickets(booking);
            return (
              <Link
                key={booking.bookingsId}
                to={`/bookings/${booking.bookingsId}`}
                className={cn(
                  'block overflow-hidden rounded-lg border bg-surface shadow-[var(--shadow-e1)] transition-[transform,box-shadow] duration-[280ms] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-e2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  unclaimed ? 'border-warning/40 ring-1 ring-warning/20' : 'border-hairline',
                )}
              >
                <div className="flex items-start justify-between gap-2 p-4">
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                      Booking #{booking.bookingNumber}
                    </p>
                    <p className="truncate font-display text-lg font-semibold text-ink">
                      {booking.eventTitle || 'Event'}
                    </p>
                    {booking.eventStartDate !== '0' ? (
                      <p className="text-xs text-ink-soft">{formatEventDate(booking.eventStartDate)}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge variant="success">{booking.status}</Badge>
                    {unclaimed ? <Badge variant="warn">{claimedSummary(booking)}</Badge> : null}
                  </div>
                </div>
                <div className="entryvine-ticket-edge" style={NOTCH} />
                <div className="flex items-center justify-between p-4 text-sm">
                  <span className="text-ink-soft">Seats reserved</span>
                  <span className="font-mono text-lg font-medium text-ink">{booking.seatsReserved}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-dashed border-hairline-strong py-16 text-center">
          <CalendarCheck2 className="mx-auto size-8 stroke-1 text-ink-faint" />
          <p className="font-display text-lg font-semibold text-ink">
            {search ? 'No bookings match your search' : 'No paid bookings yet'}
          </p>
          <p className="text-sm text-ink-soft">
            {search ? 'Try a different event name, ticket code, or guest.' : 'Completed orders show up here.'}
          </p>
        </div>
      )}
    </div>
  );
}
