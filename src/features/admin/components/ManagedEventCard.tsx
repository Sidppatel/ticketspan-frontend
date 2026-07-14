import { useCallback, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Ticket, Pencil, Eye, Share2, Send, Ban, Trash2 } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { imageUrl } from '@/shared/upload';
import { getEventStats } from '@/features/admin/services/eventAdminService';
import { toEventCardVM } from '@/features/admin/lib/dashboardInsights';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import type { Event } from '@/shared/proto/event';

const NOTCH = { ['--entryvine-notch' as string]: 'var(--surface)' } as CSSProperties;

const STATUS_VARIANT = {
  live: 'success',
  draft: 'warn',
  past: 'neutral',
  cancelled: 'danger',
} as const;

export function ManagedEventCard({
  event,
  now,
  onPublish,
  onCancel,
  onDelete,
  onShare,
}: {
  event: Event;
  now: Date;
  onPublish: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const statsLoader = useCallback(() => getEventStats(event.eventsId), [event.eventsId]);
  const { data: stats } = useAsync(statsLoader);
  const vm = toEventCardVM({ event, stats: stats ?? null }, now);
  const muted = vm.state === 'past' || vm.state === 'cancelled';

  return (
    <Card className={`flex h-full flex-col overflow-hidden ${muted ? 'opacity-80' : ''}`}>
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-sunken">
        {event.primaryImageId ? (
          <img
            src={imageUrl(event.primaryImageId)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Ticket className="h-7 w-7 text-ink-faint" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={STATUS_VARIANT[vm.state]}>{vm.statusLabel}</Badge>
        </div>
        <div className="absolute right-3 top-3">
          <Badge variant="neutral">{vm.timingLabel}</Badge>
        </div>
      </div>

      <div className="entryvine-ticket-edge mx-5" style={NOTCH} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-widest text-brand">
            <CalendarDays className="h-3.5 w-3.5" />
            {vm.dateLabel}
          </p>
          <Link
            to={`/events/${event.eventsId}`}
            className="font-display text-lg font-semibold leading-snug text-ink line-clamp-2 transition-colors hover:text-brand"
          >
            {vm.title}
          </Link>
        </div>

        <div className="space-y-2 border-t border-hairline pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-ink-soft">{vm.soldLabel}</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-ink">{vm.revenueUSD}</span>
          </div>
          {vm.capacityPct > 0 ? (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-[480ms] ease-[var(--ease-out)]"
                style={{ width: `${vm.capacityPct}%` }}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5 border-t border-hairline pt-3">
          <Link to={`/events/${event.eventsId}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              <Pencil /> Edit
            </Button>
          </Link>
          <Button size="sm" variant="ghost" aria-label="Share" onClick={onShare}>
            <Share2 />
          </Button>
          {vm.state === 'draft' ? (
            <Button size="sm" variant="ghost" aria-label="Publish" onClick={onPublish}>
              <Send /> Publish
            </Button>
          ) : vm.state === 'live' ? (
            <Button size="sm" variant="ghost" aria-label="Cancel event" onClick={onCancel}>
              <Ban />
            </Button>
          ) : null}
          <a
            href={`/events/${event.slug}`}
            target="_blank"
            rel="noreferrer"
            aria-label="View public page"
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-foreground transition-colors hover:bg-surface-sunken [&_svg]:size-4"
          >
            <Eye />
          </a>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Delete"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </Card>
  );
}
