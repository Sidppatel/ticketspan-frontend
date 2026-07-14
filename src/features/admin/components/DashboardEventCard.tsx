import { type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Ticket } from 'lucide-react';
import { imageUrl } from '@/shared/upload';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import type { EventCardVM } from '@/features/admin/lib/dashboardInsights';

const NOTCH = { ['--entryvine-notch' as string]: 'var(--surface)' } as CSSProperties;

const STATUS_VARIANT = {
  live: 'success',
  draft: 'warn',
  past: 'neutral',
  cancelled: 'danger',
} as const;

export function DashboardEventCard({ vm }: { vm: EventCardVM }) {
  const muted = vm.state === 'past' || vm.state === 'cancelled';
  const showBar = vm.capacityPct > 0;

  return (
    <Link
      to={`/events/${vm.eventsId}`}
      className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card interactive className={`flex h-full flex-col overflow-hidden ${muted ? 'opacity-75' : ''}`}>
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-sunken">
          {vm.primaryImageId ? (
            <img
              src={imageUrl(vm.primaryImageId)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[480ms] ease-[var(--ease-out)] group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Ticket className="h-7 w-7 text-ink-faint" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge variant={STATUS_VARIANT[vm.state]}>{vm.statusLabel}</Badge>
          </div>
        </div>

        <div className="entryvine-ticket-edge mx-5" style={NOTCH} />

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-widest text-brand">
              <CalendarDays className="h-3.5 w-3.5" />
              {vm.dateLabel}
            </p>
            <h3 className="font-display text-lg font-semibold leading-snug text-ink line-clamp-2 transition-colors duration-[180ms] group-hover:text-brand">
              {vm.title}
            </h3>
          </div>

          <div className="mt-auto space-y-3 border-t border-hairline pt-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-ink-soft">{vm.soldLabel}</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-ink">{vm.revenueUSD}</span>
            </div>
            {showBar ? (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-[480ms] ease-[var(--ease-out)]"
                  style={{ width: `${vm.capacityPct}%` }}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              {vm.category ? <Badge variant="neutral">{vm.category}</Badge> : <span />}
              <span className="text-xs font-medium text-ink-soft">{vm.timingLabel}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
