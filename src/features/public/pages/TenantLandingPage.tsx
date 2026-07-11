import { useCallback } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listPublicTenants, tenantUrl } from '@/features/public/services/tenantDirectoryService';
import { Card, CardContent, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { LandingHero } from '@/features/public/components/landing/LandingHero';
import {
  AdminShowcase,
  ClosingCta,
  EventNightShowcase,
  FeatureLedger,
  FloorPlanShowcase,
  HowItWorks,
  PricingTeaser,
} from '@/features/public/components/landing/LandingSections';

function OrganizerDirectory() {
  const loader = useCallback(() => listPublicTenants(), []);
  const { data, loading, error } = useAsync(loader);

  return (
    <section id="organizers" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
      <div className="max-w-md space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-voltage-ink">Tonight</p>
        <h2 className="font-display text-3xl text-ink md:text-4xl">Find your organizer</h2>
        <p className="text-ink-soft">Pick a box office to browse their events and grab tickets.</p>
      </div>

      {error ? <p className="mt-8 text-destructive">{error}</p> : null}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {!loading && !error && (data ?? []).length === 0 ? (
        <p className="mt-8 text-ink-soft">No organizers live yet. Yours could be first.</p>
      ) : null}
    </section>
  );
}

export function TenantLandingPage() {
  return (
    <div className="bg-background">
      <LandingHero />
      <HowItWorks />
      <FloorPlanShowcase />
      <AdminShowcase />
      <EventNightShowcase />
      <FeatureLedger />
      <PricingTeaser />
      <OrganizerDirectory />
      <ClosingCta />
    </div>
  );
}
