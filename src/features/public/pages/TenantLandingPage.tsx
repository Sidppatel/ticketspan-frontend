import { useCallback } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listPublicTenants, tenantUrl } from '@/features/public/services/tenantDirectoryService';
import { Card, CardContent, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

export function TenantLandingPage() {
  const loader = useCallback(() => listPublicTenants(), []);
  const { data, loading, error } = useAsync(loader);

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-8 px-4 md:mt-16">
      <div className="space-y-3 text-center">
        <span className="inline-block rounded-full bg-marigold/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-marigold-foreground">
          The box office
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Tonight starts here
        </h1>
        <p className="text-muted-foreground">Choose an organizer to browse their events and grab tickets.</p>
      </div>

      {error ? <p className="text-center text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
          : (data ?? []).map((tenant) => (
              <a
                key={tenant.slug}
                href={tenantUrl(tenant.slug)}
                className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card interactive className="h-full">
                  <CardContent className="space-y-1">
                    <CardTitle>{tenant.name}</CardTitle>
                    <p className="font-mono text-sm text-muted-foreground">{tenant.slug}</p>
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
