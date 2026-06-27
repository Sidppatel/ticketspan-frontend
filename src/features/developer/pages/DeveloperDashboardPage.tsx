import { useCallback } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { getDeveloperDashboard } from '@/features/developer/services/developerService';
import { centsToUSD } from '@/shared/lib/format';
import { Card, CardContent, CardTitle } from '@/shared/ui/card';

export function DeveloperDashboardPage() {
  const loader = useCallback(() => getDeveloperDashboard(), []);
  const { data, loading, error } = useAsync(loader);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Platform overview</h1>
      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      {data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Tenants" value={data.totalTenants} />
          <Stat label="Users" value={data.totalUsers} />
          <Stat label="Platform revenue" value={centsToUSD(data.platformRevenueCents)} />
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <CardTitle>{value}</CardTitle>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
