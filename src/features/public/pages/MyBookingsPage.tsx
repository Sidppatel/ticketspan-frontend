import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listMyBookings } from '@/features/public/services/publicEventService';
import { Card, CardContent, CardTitle } from '@/shared/ui/card';

export function MyBookingsPage() {
  const loader = useCallback(() => listMyBookings(), []);
  const { data, loading, error } = useAsync(loader);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My bookings</h1>
      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="space-y-3">
        {(data ?? []).map((booking) => (
          <Link key={booking.bookingsId} to={`/bookings/${booking.bookingsId}`}>
            <Card>
              <CardContent className="space-y-1">
                <CardTitle>#{booking.bookingNumber}</CardTitle>
                <p className="text-sm text-muted-foreground">Status: {booking.status}</p>
                <p className="text-sm text-muted-foreground">Seats reserved: {booking.seatsReserved}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {!loading && (data ?? []).length === 0 ? <p className="text-muted-foreground">No bookings yet.</p> : null}
    </div>
  );
}
