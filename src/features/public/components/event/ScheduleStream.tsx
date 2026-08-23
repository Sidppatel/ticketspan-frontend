import { useState, useCallback, useMemo, type ComponentType } from 'react';
import { Clock, Flame, Coffee, Radio, Award, CircleHelp, Layers } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listScheduleItems } from '@/features/public/services/publicEventService';
import { formatEpoch } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface ScheduleStreamProps {
  eventsId: string;
}

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Performance: Flame,
  'DJ Set': Radio,
  Break: Coffee,
  Intermission: Coffee,
  Networking: Award,
  Other: CircleHelp,
};

export function ScheduleStream({ eventsId }: ScheduleStreamProps) {
  const loader = useCallback(() => listScheduleItems(eventsId), [eventsId]);
  const { data, loading } = useAsync(loader);

  const items = useMemo(() => data ?? [], [data]);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.typeCategory) set.add(item.typeCategory);
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'ALL') return items;
    return items.filter((item) => item.typeCategory === activeFilter);
  }, [items, activeFilter]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-border-soft bg-surface-card p-6 md:p-8 animate-pulse space-y-4 min-h-[300px]">
        <div className="h-6 w-1/3 bg-muted rounded" />
        <div className="h-20 bg-muted/40 rounded-2xl" />
        <div className="h-20 bg-muted/40 rounded-2xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-xl font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
          <Clock className="size-5 text-brand" /> Schedule & Stage Stream
        </h3>

        {categories.length > 1 && (
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-all',
                activeFilter === 'ALL'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-surface-sunken text-muted-foreground hover:bg-surface-card hover:text-foreground',
              )}
            >
              All ({items.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={cn(
                  'cursor-pointer rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-all',
                  activeFilter === cat
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-surface-sunken text-muted-foreground hover:bg-surface-card hover:text-foreground',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-surface-card p-4 sm:p-6 shadow-lg">
        <div className="relative space-y-3">
          {filteredItems.map((item, index) => {
            const Icon = CATEGORY_ICONS[item.typeCategory] || CircleHelp;
            const startTimeStr = formatEpoch(item.startTime);
            const endTimeStr = formatEpoch(item.endTime);

            return (
              <div
                key={item.scheduleItemsId || index}
                className="group relative flex flex-col gap-3 rounded-2xl border border-border-soft bg-surface-sunken p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-surface-card hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand border border-brand/20 transition-transform duration-200 group-hover:scale-110">
                    <Icon className="size-4.5" />
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand">
                        {startTimeStr} – {endTimeStr}
                      </span>
                      {item.typeCategory && (
                        <span className="rounded-full bg-surface-card px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border-soft">
                          {item.typeCategory}
                        </span>
                      )}
                    </div>

                    <h4 className="font-display text-base font-bold text-foreground leading-snug">
                      {item.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-brand/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-brand border border-brand/10">
                    <Layers className="size-3" /> Live Act
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
