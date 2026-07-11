import { useCallback } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listPlatformLeads } from '@/features/public/services/platformLeadService';
import { formatEpoch } from '@/shared/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

export function DeveloperLeadsPage() {
  const loader = useCallback(() => listPlatformLeads(), []);
  const { data, loading, error } = useAsync(loader);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Leads</h1>
        <p className="text-sm text-muted-foreground">Get-started requests from the landing page.</p>
      </div>

      {error ? <p className="text-destructive">{error}</p> : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((lead) => (
            <Card key={lead.platformLeadsId}>
              <CardHeader className="flex-row items-baseline justify-between space-y-0">
                <CardTitle>
                  {lead.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{lead.companyName}</span>
                </CardTitle>
                <span className="font-mono text-xs text-muted-foreground">{formatEpoch(lead.createdAt)}</span>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm">
                  <a href={`tel:${lead.phone}`} className="text-text-link">
                    {lead.phone}
                  </a>
                  {lead.website ? (
                    <a
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-text-link"
                    >
                      {lead.website}
                    </a>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{lead.description}</p>
              </CardContent>
            </Card>
          ))}
          {(data ?? []).length === 0 && !error ? (
            <p className="text-muted-foreground">No leads yet. They land here when someone submits the get-started form.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
