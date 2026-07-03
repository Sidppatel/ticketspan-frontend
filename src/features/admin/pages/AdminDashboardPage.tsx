import { useCallback } from 'react';
import { Activity, CalendarDays, DollarSign, Users, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { getAdminDashboard } from '@/features/admin/services/adminService';
import { listBookings } from '@/features/admin/services/bookingAdminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { centsToUSD } from '@/shared/lib/format';

export function AdminDashboardPage() {
  const loader = useCallback(() => getAdminDashboard(), []);
  const { data, loading, error } = useAsync(loader);

  const bookingsLoader = useCallback(() => listBookings('', 'Paid'), []);
  const { data: bookings, loading: bookingsLoading } = useAsync(bookingsLoader);
  const recentBookings = (bookings ?? []).slice(0, 8);

  const revenueUSD = data ? centsToUSD(data.totalRevenueCents) : '$0.00';

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-2">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Sales, bookings, and door operations at a glance.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => <StatSkeleton key={i} />)
        ) : data ? (
          <>
            <Stat icon={<DollarSign />} label="Total revenue" value={revenueUSD} />
            <Stat icon={<Users />} label="Attendees registered" value={data.totalAttendees} />
            <Stat icon={<Activity />} label="Active events" value={data.activeEvents} />
            <Stat icon={<CalendarDays />} label="Total events" value={data.totalEvents} />
          </>
        ) : null}
      </div>

      <Card interactive={false} className="overflow-hidden shadow-[var(--shadow-e1)]">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-brand" /> Recent bookings
          </CardTitle>
          <Link to="/bookings" className="text-xs font-medium text-brand hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {bookingsLoading ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="divide-y divide-hairline">
              {recentBookings.map((b) => (
                <div key={b.bookingsId} className="flex items-center justify-between gap-3 px-6 py-3 text-sm">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-mono font-medium text-foreground">#{b.bookingNumber}</p>
                    <p className="text-xs text-ink-soft">
                      {b.seatsReserved} {b.seatsReserved === 1 ? 'seat' : 'seats'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-sm text-foreground">{centsToUSD(b.subtotalCents)}</span>
                    <Badge
                      variant={
                        b.status === 'Paid' ? 'success' : b.status === 'Cancelled' ? 'neutral' : 'warn'
                      }
                    >
                      {b.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-sm text-ink-soft">No bookings yet — they'll appear here as they come in.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card interactive={false} className="transition-colors hover:border-hairline-strong">
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
    <Card interactive={false}>
      <CardContent className="space-y-3 p-5">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
        <div className="h-7 w-20 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
