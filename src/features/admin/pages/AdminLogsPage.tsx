import { useCallback, useMemo, useState } from 'react';
import { Calendar, Check, ChevronsUpDown, ScrollText, Search } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listAdminEvents } from '@/features/admin/services/adminService';
import { getAdminLogs } from '@/features/admin/services/logAdminService';
import { formatEpoch, formatEventDate } from '@/shared/lib/format';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { EmptyState } from '@/shared/ui/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card, CardContent } from '@/shared/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { cn } from '@/shared/lib/cn';
import type { Event } from '@/shared/proto/event';

const PAGE_SIZE = 25;

function pickDefaultEvent(events: Event[], now: Date): string {
  if (events.length === 0) return '';
  const nowSec = Math.floor(now.getTime() / 1000);
  const upcoming = events
    .filter((e) => (Number(e.startDate) || 0) >= nowSec)
    .sort((a, b) => (Number(a.startDate) || 0) - (Number(b.startDate) || 0));
  if (upcoming.length > 0) return upcoming[0].eventsId;
  const recent = [...events].sort((a, b) => (Number(b.startDate) || 0) - (Number(a.startDate) || 0));
  return recent[0].eventsId;
}

export function AdminLogsPage() {
  const eventsLoader = useCallback(() => listAdminEvents(), []);
  const { data: events, loading: eventsLoading } = useAsync(eventsLoader);

  const now = useMemo(() => new Date(), []);
  const allEvents = useMemo(() => events ?? [], [events]);
  const [override, setOverride] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = override !== '' ? override : pickDefaultEvent(allEvents, now);
  const selectedEvent = allEvents.find((e) => e.eventsId === selected) ?? null;
  const filteredEvents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length === 0) return allEvents;
    return allEvents.filter((e) => e.title.toLowerCase().includes(term));
  }, [allEvents, query]);

  const logsLoader = useCallback(
    () => (selected === '' ? Promise.resolve({ entries: [], total: 0 }) : getAdminLogs({ eventsId: selected, limit: shown })),
    [selected, shown],
  );
  const { data: logs, loading: logsLoading, error } = useAsync(logsLoader);
  const entries = logs?.entries ?? [];
  const total = logs?.total ?? 0;

  function choose(id: string) {
    setOverride(id);
    setShown(PAGE_SIZE);
    setPickerOpen(false);
    setQuery('');
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-1 border-b border-border/40 pb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Activity Logs
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Audit timeline of actions, configuration changes, and operations per event.
        </p>
      </div>

      <div className="max-w-md space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Select Event
        </label>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-input bg-surface px-3.5 py-2.5 text-left text-sm shadow-xs transition-colors hover:bg-muted/40"
              disabled={eventsLoading || allEvents.length === 0}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Calendar className="size-4 shrink-0 text-primary" />
                <span className="truncate font-medium text-foreground">
                  {eventsLoading ? 'Loading events…' : selectedEvent ? selectedEvent.title : 'No events available'}
                </span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
            <div className="relative border-b border-border p-1.5">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter events…"
                className="h-8 border-0 pl-8 text-xs shadow-none focus-visible:ring-0"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((e) => (
                  <button
                    key={e.eventsId}
                    onClick={() => choose(e.eventsId)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted',
                      e.eventsId === selected ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground',
                    )}
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-medium">{e.title}</span>
                      <span className="block text-[10px] text-muted-foreground">{formatEventDate(e.startDate)}</span>
                    </div>
                    {e.eventsId === selected && <Check className="size-3.5 shrink-0 text-primary" />}
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">No events match "{query}".</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {logsLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <ul className="divide-y divide-border/40">
                {entries.map((entry) => (
                  <li key={entry.id} className="flex gap-4 p-4 hover:bg-muted/20 transition-colors">
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="text-xs sm:text-sm font-semibold text-foreground">
                          <span className="capitalize">{entry.action}</span>{' '}
                          <span className="text-muted-foreground font-normal">· {entry.entityType}</span>
                        </p>
                        <span className="font-mono text-[11px] text-muted-foreground">{formatEpoch(entry.timestamp)}</span>
                      </div>
                      {entry.detail && <p className="text-xs text-muted-foreground">{entry.detail}</p>}
                      {entry.actorEmail && (
                        <p className="text-[11px] text-muted-foreground font-mono">By: {entry.actorEmail}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {shown < total && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                Load Older Activity
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<ScrollText className="size-6 text-muted-foreground" />}
          title={allEvents.length === 0 ? 'No Events Created' : 'No Activity Logged'}
          description={
            allEvents.length === 0
              ? 'Create an event in your admin portal to start recording activity and sales logs.'
              : 'No recorded actions for this event yet. Actions and configuration changes will appear in this timeline.'
          }
        />
      )}
    </div>
  );
}
