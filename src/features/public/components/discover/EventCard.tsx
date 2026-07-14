import { Link } from 'react-router-dom';
import { type CSSProperties } from 'react';
import type { Event } from '@/shared/proto/event';
import { imageUrl } from '@/shared/upload';
import { formatEventDate } from '@/shared/lib/format';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Ticket } from 'lucide-react';

const NOTCH = { ['--entryvine-notch' as string]: 'var(--surface)' } as CSSProperties;

export function EventCard({ event, index }: { event: Event; index: number }) {
  return (
    <Link
      to={`/events/${event.slug}`}
      className="entryvine-page group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <Card interactive className="flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-sunken">
          {event.primaryImageId ? (
            <img
              src={imageUrl(event.primaryImageId)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[480ms] ease-[var(--ease-out)] group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Ticket className="h-8 w-8 text-ink-faint" />
            </div>
          )}
        </div>
        <div className="entryvine-ticket-edge mx-5" style={NOTCH} />
        <CardContent className="flex flex-1 flex-col justify-between gap-3 p-5">
          <div className="space-y-1.5">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-brand">
              {formatEventDate(event.startDate)}
            </p>
            <h3 className="font-display text-lg font-semibold leading-snug text-ink line-clamp-2 transition-colors duration-[180ms] group-hover:text-brand">
              {event.title}
            </h3>
          </div>
          <div className="flex items-center justify-between border-t border-hairline pt-3">
            {event.category ? <Badge variant="neutral">{event.category}</Badge> : <span />}
            <span className="text-xs font-medium text-ink-soft transition-colors duration-[180ms] group-hover:text-brand">
              View event →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
