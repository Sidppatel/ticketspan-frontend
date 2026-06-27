import { useCallback } from 'react';
import { Activity, CalendarDays, DollarSign, Users } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { getAdminDashboard } from '@/features/admin/services/adminService';
import { Card, CardContent } from '@/shared/ui/card';

export function AdminDashboardPage() {
  const loader = useCallback(() => getAdminDashboard(), []);
  const { data, loading, error } = useAsync(loader);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your tenant at a glance.</p>
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => <StatSkeleton key={i} />)
        ) : data ? (
          <>
            <Stat icon={<CalendarDays />} label="Total events" value={data.totalEvents} />
            <Stat icon={<Activity />} label="Active events" value={data.activeEvents} />
            <Stat icon={<Users />} label="Attendees" value={data.totalAttendees} />
            <Stat icon={<DollarSign />} label="Revenue (cents)" value={data.totalRevenueCents} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-2 p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
          {icon}
        </div>
        <p className="text-2xl font-bold tracking-tight tabular-nums md:text-3xl">{value}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
        <div className="h-7 w-16 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
