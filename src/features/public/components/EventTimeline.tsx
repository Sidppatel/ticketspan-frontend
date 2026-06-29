import { useCallback } from 'react';
import { CalendarClock } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listScheduleItems } from '@/features/public/services/publicEventService';
import { formatEpoch } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const TYPE_STYLES: Record<string, string> = {
  Performance: 'bg-primary/15 text-primary ring-primary/30',
  Break: 'bg-amber/15 text-amber-foreground ring-amber/30',
  Intermission: 'bg-muted text-muted-foreground ring-border',
  'DJ Set': 'bg-success/15 text-success ring-success/30',
  Networking: 'bg-secondary/15 text-secondary-foreground ring-border',
  Other: 'bg-muted text-muted-foreground ring-border',
};

export function EventTimeline({ eventsId }: { eventsId: string }) {
  const loader = useCallback(() => listScheduleItems(eventsId), [eventsId]);
  const { data } = useAsync(loader);
  const items = data ?? [];
  if (items.length === 0) {
    return null;
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
          <CalendarClock />
        </span>
        <CardTitle>Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 border-l-2 border-dashed border-border pl-3">
          {items.map((item) => (
            <li
              key={item.scheduleItemsId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium tabular-nums text-muted-foreground">
                  {formatEpoch(item.startTime)} – {formatEpoch(item.endTime)}
                </p>
                <p className="truncate font-medium">{item.title}</p>
              </div>
              <span
                className={cn(
                  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                  TYPE_STYLES[item.typeCategory] ?? TYPE_STYLES.Other,
                )}
              >
                {item.typeCategory}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
