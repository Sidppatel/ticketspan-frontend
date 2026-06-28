import { useCallback, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listScheduleItems,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  type ScheduleItemDraft,
} from '@/features/admin/services/eventAdminService';
import { rpcErrorMessage } from '@/shared/session';
import {
  epochToZonedInput,
  zonedInputToEpoch,
  zoneAbbrev,
  formatTimeRangeInZone,
  formatEpochInZone,
  epochSeconds,
} from '@/shared/lib/timezone';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ScheduleItem } from '@/shared/proto/event';

const TYPE_OPTIONS = ['Performance', 'Break', 'Intermission', 'DJ Set', 'Networking', 'Other'];

const TYPE_STYLES: Record<string, string> = {
  Performance: 'bg-primary/15 text-primary ring-primary/30',
  Break: 'bg-amber/15 text-amber-foreground ring-amber/30',
  Intermission: 'bg-muted text-muted-foreground ring-border',
  'DJ Set': 'bg-success/15 text-success ring-success/30',
  Networking: 'bg-secondary/15 text-secondary-foreground ring-border',
  Other: 'bg-muted text-muted-foreground ring-border',
};

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        TYPE_STYLES[type] ?? TYPE_STYLES.Other,
      )}
    >
      {type}
    </span>
  );
}

export function ScheduleTimeline({
  eventsId,
  eventStart,
  eventEnd,
  timeZone,
}: {
  eventsId: string;
  eventStart: string;
  eventEnd: string;
  timeZone: string;
}) {
  const loader = useCallback(() => listScheduleItems(eventsId), [eventsId]);
  const items = useAsync(loader);
  const list = items.data ?? [];

  const [dialogItem, setDialogItem] = useState<ScheduleItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  const listRef = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      if (reduced() || !flashId || !listRef.current) {
        return;
      }
      const row = listRef.current.querySelector<HTMLElement>(`[data-id="${flashId}"]`);
      if (row) {
        gsap.fromTo(
          row,
          { opacity: 0, y: 16, backgroundColor: 'rgba(127,127,127,0.12)' },
          { opacity: 1, y: 0, backgroundColor: 'rgba(127,127,127,0)', duration: 0.25, ease: 'power2.out' },
        );
      }
    },
    { dependencies: [flashId, list.length], scope: listRef },
  );

  function openCreate() {
    setDialogItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: ScheduleItem) {
    setDialogItem(item);
    setDialogOpen(true);
  }

  async function handleSubmit(draft: ScheduleItemDraft) {
    setNotice(null);
    if (dialogItem) {
      await updateScheduleItem(dialogItem.scheduleItemsId, draft);
      setFlashId(dialogItem.scheduleItemsId);
    } else {
      const newId = await createScheduleItem(eventsId, draft);
      setFlashId(newId);
    }
    setDialogOpen(false);
    items.reload();
  }

  function handleDelete(item: ScheduleItem) {
    const row = listRef.current?.querySelector<HTMLElement>(`[data-id="${item.scheduleItemsId}"]`);
    const remove = async () => {
      try {
        await deleteScheduleItem(item.scheduleItemsId);
        items.reload();
      } catch (caught) {
        setNotice(rpcErrorMessage(caught));
        items.reload();
      }
    };
    if (reduced() || !row) {
      void remove();
      return;
    }
    gsap.to(row, {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => void remove(),
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
            <CalendarClock />
          </span>
          <CardTitle>Schedule timeline</CardTitle>
        </div>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Times in {zoneAbbrev(timeZone)}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {notice ? <p className="text-sm text-amber-foreground">{notice}</p> : null}
        {items.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-sm">
          <span className="size-2 rounded-full bg-primary" />
          <span className="font-medium">Event starts</span>
          <span className="ml-auto tabular-nums text-muted-foreground">
            {formatEpochInZone(eventStart, timeZone)}
          </span>
        </div>

        {!items.loading && list.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            No schedule items yet. Add the first block of your run-of-show — it must sit between the
            event start and end above.
          </p>
        ) : null}

        <ul ref={listRef} className="space-y-2 border-l-2 border-dashed border-border pl-3">
          {list.map((item) => (
            <li
              key={item.scheduleItemsId}
              data-id={item.scheduleItemsId}
              className="flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium tabular-nums text-muted-foreground">
                  {formatTimeRangeInZone(item.startTime, item.endTime, timeZone)}
                </p>
                <p className="truncate font-medium">{item.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <TypeBadge type={item.typeCategory} />
                <Button size="icon" variant="ghost" aria-label="Edit item" onClick={() => openEdit(item)}>
                  <Pencil />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Delete item" onClick={() => handleDelete(item)}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-sm">
          <span className="size-2 rounded-full bg-primary" />
          <span className="font-medium">Event ends</span>
          <span className="ml-auto tabular-nums text-muted-foreground">
            {formatEpochInZone(eventEnd, timeZone)}
          </span>
        </div>

        <Button variant="outline" className="w-full" onClick={openCreate}>
          <Plus /> Add item
        </Button>
      </CardContent>

      {dialogOpen ? (
        <ScheduleItemDialog
          item={dialogItem}
          eventStart={eventStart}
          eventEnd={eventEnd}
          siblings={list}
          timeZone={timeZone}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </Card>
  );
}

function ScheduleItemDialog({
  item,
  eventStart,
  eventEnd,
  siblings,
  timeZone,
  onClose,
  onSubmit,
}: {
  item: ScheduleItem | null;
  eventStart: string;
  eventEnd: string;
  siblings: ScheduleItem[];
  timeZone: string;
  onClose: () => void;
  onSubmit: (draft: ScheduleItemDraft) => Promise<void>;
}) {
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(item?.title ?? '');
  const [type, setType] = useState(item?.typeCategory ?? TYPE_OPTIONS[0]);
  const [start, setStart] = useState(item ? epochToZonedInput(item.startTime, timeZone) : '');
  const [end, setEnd] = useState(item ? epochToZonedInput(item.endTime, timeZone) : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useGSAP(
    () => {
      if (reduced()) {
        firstField.current?.focus();
        return;
      }
      gsap.from(overlay.current, { autoAlpha: 0, duration: 0.2, ease: 'power1.out' });
      gsap.from(panel.current, {
        autoAlpha: 0,
        y: 24,
        scale: 0.96,
        duration: 0.32,
        ease: 'power3.out',
        onComplete: () => firstField.current?.focus(),
      });
    },
    { scope: overlay },
  );

  function animateOut(done: () => void) {
    if (reduced()) {
      done();
      return;
    }
    gsap
      .timeline({ onComplete: done })
      .to(panel.current, { autoAlpha: 0, y: 16, scale: 0.97, duration: 0.2, ease: 'power2.in' }, 0)
      .to(overlay.current, { autoAlpha: 0, duration: 0.2, ease: 'power1.in' }, 0.04);
  }

  const requestClose = () => animateOut(onClose);

  function validate(startEpoch: number, endEpoch: number): string | null {
    if (!title.trim()) {
      return 'Give the item a title.';
    }
    if (!startEpoch || !endEpoch) {
      return 'Pick a start and end time.';
    }
    if (endEpoch <= startEpoch) {
      return 'End time must be after the start time.';
    }
    if (startEpoch < epochSeconds(eventStart) || endEpoch > epochSeconds(eventEnd)) {
      return 'Item must fall within the event start and end time.';
    }
    const clash = siblings.some(
      (s) =>
        s.scheduleItemsId !== item?.scheduleItemsId &&
        startEpoch < epochSeconds(s.endTime) &&
        epochSeconds(s.startTime) < endEpoch,
    );
    if (clash) {
      return 'This time range overlaps another schedule item.';
    }
    return null;
  }

  async function submit() {
    const startEpoch = Number(zonedInputToEpoch(start, timeZone));
    const endEpoch = Number(zonedInputToEpoch(end, timeZone));
    const message = validate(startEpoch, endEpoch);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        typeCategory: type,
        startTime: String(startEpoch),
        endTime: String(endEpoch),
      });
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={overlay}
      role="dialog"
      aria-modal="true"
      aria-label={item ? 'Edit schedule item' : 'Add schedule item'}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          requestClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          requestClose();
        }
      }}
    >
      <div
        ref={panel}
        className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 space-y-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
            Run of show
          </p>
          <h3 className="font-display text-xl tracking-tight">
            {item ? 'Edit schedule item' : 'Add schedule item'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Must fall within the event window and not overlap another item.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="schedule-title">Title</Label>
            <Input
              id="schedule-title"
              ref={firstField}
              value={title}
              placeholder="Doors Open & Welcome"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="schedule-type">Type</Label>
            <Select id="schedule-type" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Starts</Label>
            <DateTimePicker value={start} onChange={setStart} timeZone={timeZone} />
          </div>
          <div className="space-y-1">
            <Label>Ends</Label>
            <DateTimePicker value={end} onChange={setEnd} timeZone={timeZone} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={requestClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : item ? 'Save item' : 'Add item'}
          </Button>
        </div>
      </div>
    </div>
  );
}
