import { useCallback, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listPublicEvents } from '@/features/public/services/publicEventService';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { imageUrl } from '@/shared/upload';

const NOTCH = { ['--svyne-notch' as string]: '#ffffff' } as CSSProperties;

export function EventListPage() {
  const [search, setSearch] = useState('');
  const loader = useCallback(() => listPublicEvents(search), [search]);
  const { data, loading, error } = useAsync(loader);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Upcoming events</h1>
        <p className="text-sm text-muted-foreground">Find your next night out.</p>
      </div>
      <Input placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} />
      {error ? <p className="text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))
          : (data ?? []).map((event, i) => (
              <Link
                key={event.eventsId}
                to={`/events/${event.slug}`}
                className="svyne-page rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <Card interactive className="group h-full overflow-hidden">
                  {event.primaryImageId ? (
                    <img
                      src={imageUrl(event.primaryImageId)}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : null}
                  <div className="svyne-ticket-edge" style={NOTCH} />
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="transition-colors group-hover:text-primary">{event.title}</CardTitle>
                      <span className="shrink-0 rounded-full bg-marigold/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-marigold-foreground">
                        {event.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.category}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {!loading && (data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-muted-foreground">
          No events found.
        </div>
      ) : null}
    </div>
  );
}
