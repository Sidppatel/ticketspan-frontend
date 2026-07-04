import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getDeveloperDashboard,
  listTenants,
  achEnabledCount,
  getDeveloperLogs,
} from '@/features/developer/services/developerService';
import { centsToUSD, formatEpoch } from '@/shared/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const ACTION_CLASS =
  'inline-flex h-10 items-center rounded-md border border-hairline-strong bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-sunken';

export function DeveloperDashboardPage() {
  const { data, loading, error } = useAsync(useCallback(() => getDeveloperDashboard(), []));
  const tenants = useAsync(useCallback(() => listTenants(), []));
  const logs = useAsync(useCallback(() => getDeveloperLogs(), []));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Developer Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here's what's happening across the platform.
        </p>
      </header>

      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Tenants" value={data ? data.totalTenants : '—'} />
        <Stat label="Revenue" value={data ? centsToUSD(data.platformRevenueCents) : '—'} />
        <Stat label="Users" value={data ? data.totalUsers : '—'} />
        <Stat
          label="ACH Enabled"
          value={tenants.data ? achEnabledCount(tenants.data) : '—'}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/tenants" className={ACTION_CLASS}>View All Tenants</Link>
          <Link to="/reporting-access" className={ACTION_CLASS}>Manage ACH Settings</Link>
          <Link to="/revenue" className={ACTION_CLASS}>View Reports</Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {(logs.data ?? []).slice(0, 8).map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="font-medium">{entry.action}</span>
              <span className="text-muted-foreground">{entry.entityType}</span>
              <span className="text-xs text-muted-foreground">{formatEpoch(entry.timestamp)}</span>
            </div>
          ))}
          {logs.data && logs.data.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No recent activity.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="space-y-1 pt-5">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
