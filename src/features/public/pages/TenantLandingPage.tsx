import { useCallback } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listPublicTenants, tenantUrl } from '@/features/public/services/tenantDirectoryService';
import { Card, CardContent, CardTitle } from '@/shared/ui/card';

export function TenantLandingPage() {
  const loader = useCallback(() => listPublicTenants(), []);
  const { data, loading, error } = useAsync(loader);

  return (
    <div className="mx-auto mt-16 max-w-3xl space-y-6 px-4">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Welcome to Svyne</h1>
        <p className="text-muted-foreground">Choose an organizer to browse their events.</p>
      </div>
      {loading ? <p className="text-center text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-center text-destructive">{error}</p> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((tenant) => (
          <a key={tenant.slug} href={tenantUrl(tenant.slug)}>
            <Card interactive>
              <CardContent className="space-y-1">
                <CardTitle>{tenant.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{tenant.slug}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
      {!loading && (data ?? []).length === 0 ? (
        <p className="text-center text-muted-foreground">No organizers available yet.</p>
      ) : null}
    </div>
  );
}
