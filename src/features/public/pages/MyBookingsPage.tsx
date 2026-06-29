import { useCallback, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listMyBookings } from '@/features/public/services/publicEventService';
import { Skeleton } from '@/shared/ui/skeleton';

const NOTCH = { ['--svyne-notch' as string]: '#ffffff' } as CSSProperties;

export function MyBookingsPage() {
  const loader = useCallback(() => listMyBookings(), []);
  const { data, loading, error } = useAsync(loader);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">My bookings</h1>
      {error ? <p className="text-destructive">{error}</p> : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((booking) => (
            <Link
              key={booking.bookingsId}
              to={`/bookings/${booking.bookingsId}`}
              className="block overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex items-start justify-between gap-2 p-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Booking</p>
                  <p className="font-mono text-lg font-semibold">#{booking.bookingNumber}</p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                  {booking.status}
                </span>
              </div>
              <div className="svyne-ticket-edge" style={NOTCH} />
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-muted-foreground">Seats reserved</span>
                <span className="font-display text-xl font-bold text-marigold">{booking.seatsReserved}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && (data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-muted-foreground">
          No bookings yet. Browse events to grab your first ticket.
        </div>
      ) : null}
    </div>
  );
}
