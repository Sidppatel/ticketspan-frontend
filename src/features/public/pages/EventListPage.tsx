import { useCallback, useMemo, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { listPublicEvents } from '@/features/public/services/publicEventService';
import { pickHeroEvent, restOfEvents, distinctCategories } from '@/features/public/lib/discover';
import { HeroEvent } from '@/features/public/components/discover/HeroEvent';
import { EventCard } from '@/features/public/components/discover/EventCard';
import { FilterBar } from '@/features/public/components/discover/FilterBar';
import { Skeleton } from '@/shared/ui/skeleton';
import { currentTenantSlug } from '@/shared/subdomain';
import { useTenantBranding } from '@/shared/theme/ThemeContext';
import { CalendarX, RefreshCw } from 'lucide-react';

export function EventListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const debouncedSearch = useDebouncedValue(search);
  const tenantSlug = currentTenantSlug();
  const { branding } = useTenantBranding();

  const loader = useCallback(
    () => listPublicEvents(debouncedSearch, category === 'All' ? '' : category),
    [debouncedSearch, category],
  );
  const { data, loading, error, reload } = useAsync(loader);

  const categoriesLoader = useCallback(() => listPublicEvents('', ''), []);
  const { data: allEvents } = useAsync(categoriesLoader);
  const categories = useMemo(() => (allEvents ? distinctCategories(allEvents) : []), [allEvents]);

  const isUnfiltered = !debouncedSearch && category === 'All';
  const hero = useMemo(() => (isUnfiltered && data ? pickHeroEvent(data) : null), [data, isUnfiltered]);
  const gridEvents = useMemo(() => (data ? restOfEvents(data, hero) : []), [data, hero]);

  const organizerDisplayName = branding.tenantName || (tenantSlug ? `@${tenantSlug}` : 'Box Office');

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-24">
      {/* Box Office Showcase Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-card/85 p-6 shadow-[var(--shadow-e3)] backdrop-blur-xl sm:p-10 md:p-12">
        <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
                <span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Official Box Office
              </span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {organizerDisplayName}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Explore upcoming concerts, festivals, private tables, and live experiences with instant confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Spotlight Hero */}
      {loading && !data ? (
        <Skeleton className="h-[420px] w-full rounded-[2rem] md:h-[500px]" />
      ) : hero ? (
        <HeroEvent event={hero} />
      ) : null}

      {/* Live Search & Filter Bar */}
      <FilterBar
        categories={categories}
        selected={category}
        onSelect={setCategory}
        search={search}
        onSearch={setSearch}
      />

      {/* Error Alert */}
      {error ? (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
          <span>Failed to load events: {error}</span>
          <button
            type="button"
            onClick={() => reload()}
            className="inline-flex items-center gap-1 font-mono text-xs underline hover:no-underline"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        </div>
      ) : null}

      {/* Event Catalog Grid */}
      {gridEvents.length > 0 || loading ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {isUnfiltered ? 'Upcoming Experiences' : 'Filtered Results'}
              </h2>
              <p className="font-mono text-xs text-muted-foreground">
                Showing {gridEvents.length} event{gridEvents.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card p-2 space-y-3">
                    <Skeleton className="aspect-[16/10] w-full rounded-[1.25rem]" />
                    <div className="space-y-2 p-3">
                      <Skeleton className="h-4 w-1/3 rounded" />
                      <Skeleton className="h-6 w-3/4 rounded" />
                      <Skeleton className="h-4 w-1/2 rounded" />
                    </div>
                  </div>
                ))
              : gridEvents.map((event, i) => <EventCard key={event.eventsId} event={event} index={i} />)}
          </div>
        </section>
      ) : null}

      {/* Empty State */}
      {!loading && !hero && gridEvents.length === 0 && !error ? (
        <div className="mx-auto max-w-lg space-y-5 rounded-[2rem] border border-dashed border-border p-12 text-center bg-card/40 backdrop-blur-sm">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-sm">
            <CalendarX className="size-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-xl font-bold text-foreground">
              No events match your criteria
            </h3>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch || category !== 'All'
                ? 'Try broadening your search or switching categories.'
                : 'New events are announced regularly. Check back soon!'}
            </p>
          </div>
          {debouncedSearch || category !== 'All' ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('All');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
