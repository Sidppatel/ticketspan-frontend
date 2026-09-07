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
import { CalendarX, RefreshCw, ShieldCheck, Ticket, Sparkles, Layers } from 'lucide-react';

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
  const totalCount = allEvents ? allEvents.length : data ? data.length : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-24">
      <section className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-border/80 bg-card p-1.5 sm:p-2 shadow-[var(--shadow-e3)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -left-28 -top-28 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 -bottom-28 size-96 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:gap-6 rounded-[calc(1.5rem-0.375rem)] sm:rounded-[calc(2.5rem-0.5rem)] bg-background/50 p-4 sm:p-8 md:p-12">
          <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-2.5 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 font-mono text-[11px] sm:text-xs font-semibold text-primary">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Official Box Office
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2.5 py-0.5 font-mono text-[11px] sm:text-xs font-medium text-muted-foreground backdrop-blur-md">
                  <ShieldCheck className="size-3.5 text-primary" /> Guaranteed Authentic
                </span>
              </div>

              <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                {organizerDisplayName}
              </h1>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-base max-w-2xl">
                Explore premier live concerts, keynote summits, private VIP tables, and curated festival experiences with instantaneous digital delivery.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 md:justify-end">
              <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 px-4 py-3 shadow-xs backdrop-blur-md">
                <Ticket className="size-5 text-primary" />
                <div>
                  <span className="block font-mono text-base font-extrabold text-foreground leading-none">
                    {totalCount}
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    Live Events
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 px-4 py-3 shadow-xs backdrop-blur-md">
                <Layers className="size-5 text-primary" />
                <div>
                  <span className="block font-mono text-base font-extrabold text-foreground leading-none">
                    {categories.length}
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    Categories
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading && !data ? (
        <Skeleton className="h-[460px] w-full rounded-[2.5rem] md:h-[520px]" />
      ) : hero ? (
        <HeroEvent event={hero} />
      ) : null}

      <FilterBar
        categories={categories}
        selected={category}
        onSelect={setCategory}
        search={search}
        onSearch={setSearch}
      />

      {error ? (
        <div className="flex items-center justify-between rounded-[2rem] border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          <span className="font-medium">Failed to load box office events: {error}</span>
          <button
            type="button"
            onClick={() => reload()}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-background/80 px-4 py-2 font-mono text-xs font-semibold text-destructive hover:bg-destructive/15 active:scale-[0.98]"
          >
            <RefreshCw className="size-3.5" /> Retry
          </button>
        </div>
      ) : null}

      {gridEvents.length > 0 || loading ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="space-y-0.5">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
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
                  <div key={i} className="overflow-hidden rounded-[2rem] border border-border/60 bg-card p-2 space-y-3">
                    <Skeleton className="aspect-[16/10] w-full rounded-[calc(2rem-0.375rem)]" />
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

      {!loading && !hero && gridEvents.length === 0 && !error ? (
        <div className="mx-auto max-w-lg space-y-5 rounded-[2.5rem] border border-dashed border-border/80 p-12 text-center bg-card/40 backdrop-blur-sm">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-sm">
            <CalendarX className="size-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-xl font-bold text-foreground">
              No events match your criteria
            </h3>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch || category !== 'All'
                ? 'Try broadening your search term or switching to another category.'
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
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
