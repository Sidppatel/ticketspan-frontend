import { Link } from 'react-router-dom';
import { CalendarDays, Globe } from 'lucide-react';
import { imageUrl } from '@/shared/upload';
import { formatEpoch } from '@/shared/lib/format';
import { Card, CardContent } from '@/shared/ui/card';
import { parseMeta, metaValue, type MetaItem } from './catalogJson';
import type { PublicLinkedEvent } from '@/shared/proto/catalog';

const SOCIAL_KEYS = ['website', 'instagram', 'twitter', 'facebook', 'youtube', 'linkedin', 'tiktok'];
const DETAIL_SKIP = new Set([...SOCIAL_KEYS, 'description']);

function href(key: string, value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (key === 'website') {
    return `https://${value}`;
  }
  return `https://${key}.com/${value.replace(/^@/, '')}`;
}

export function CatalogProfile({
  name,
  primaryImagePath,
  metaJson,
  events,
}: {
  name: string;
  primaryImagePath: string;
  metaJson: string;
  events: PublicLinkedEvent[];
}) {
  const meta = parseMeta(metaJson);
  const description = metaValue(meta, 'description');
  const socials = meta.filter((item) => SOCIAL_KEYS.includes(item.key.toLowerCase()) && item.value);
  const details = meta.filter((item: MetaItem) => !DETAIL_SKIP.has(item.key.toLowerCase()) && item.value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {primaryImagePath ? (
          <img
            src={imageUrl(primaryImagePath)}
            alt=""
            className="size-40 shrink-0 rounded-xl object-cover"
          />
        ) : null}
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{name}</h1>
          {details.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {details.map((item) => (
                <span
                  key={item.key}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {item.value}
                </span>
              ))}
            </div>
          ) : null}
          {socials.length > 0 ? (
            <div className="flex flex-wrap gap-3 text-sm">
              {socials.map((item) => (
                <a
                  key={item.key}
                  href={href(item.key, item.value)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="size-3.5" /> {item.key}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {description ? <p className="max-w-2xl whitespace-pre-wrap text-foreground">{description}</p> : null}

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays className="size-4 text-primary" /> Upcoming events
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.eventsId} to={`/events/${event.slug}`} className="group rounded-lg">
                <Card interactive className="h-full overflow-hidden">
                  {event.primaryImagePath ? (
                    <img
                      src={imageUrl(event.primaryImagePath)}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : null}
                  <CardContent className="space-y-1 py-3">
                    <p className="font-medium transition-colors group-hover:text-primary">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{formatEpoch(event.startDate)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
