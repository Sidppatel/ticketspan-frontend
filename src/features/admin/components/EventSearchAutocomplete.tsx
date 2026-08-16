import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/ui/popover';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Search, X, Check, Calendar, ChevronDown, Layers } from 'lucide-react';
import { formatEventDate } from '@/shared/lib/format';
import type { Event } from '@/shared/proto/event';

interface EventSearchAutocompleteProps {
  events: Event[];
  selectedEventsId: string;
  onSelectEvent: (eventsId: string) => void;
  isLoading?: boolean;
}

export function EventSearchAutocomplete({
  events,
  selectedEventsId,
  onSelectEvent,
  isLoading,
}: EventSearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedEvent = events.find((e) => e.eventsId === selectedEventsId);

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(id: string) {
    onSelectEvent(id);
    setOpen(false);
    setSearch('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onSelectEvent('');
    setSearch('');
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm transition-all hover:border-primary/50 focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
            {selectedEvent ? (
              <span className="truncate font-semibold text-foreground font-display">
                {selectedEvent.title}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm truncate">
                {isLoading ? 'Loading events…' : 'All Events (No filter)'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {selectedEventsId ? (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Clear event filter"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                open ? 'rotate-180 text-foreground' : ''
              }`}
            />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] min-w-[320px] max-w-md p-2 shadow-2xl rounded-2xl border border-border bg-popover text-popover-foreground z-50 animate-in fade-in-50 zoom-in-95 duration-150"
      >
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              autoFocus
              placeholder="Filter events by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs bg-muted/40 border-border/70 rounded-lg"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
            <div
              onClick={() => handleSelect('')}
              className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                !selectedEventsId
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-muted/60 text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-muted-foreground/40" />
                <span>All Events (Show all bookings)</span>
              </div>
              {!selectedEventsId && <Check className="h-3.5 w-3.5 text-primary" />}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No events found matching "{search}"
              </div>
            ) : (
              <div className="divide-y divide-border/20 pt-1">
                {filteredEvents.map((event) => {
                  const isSelected = selectedEventsId === event.eventsId;
                  return (
                    <div
                      key={event.eventsId}
                      onClick={() => handleSelect(event.eventsId)}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 text-xs rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-medium truncate font-display text-foreground">
                          {event.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {formatEventDate(event.startDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={event.status.toLowerCase() === 'published' ? 'success' : 'neutral'}
                          className="text-[10px] h-4 font-normal"
                        >
                          {event.status}
                        </Badge>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
