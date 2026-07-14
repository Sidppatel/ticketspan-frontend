import type { Event } from '@/shared/proto/event';

const KEY_PREFIX = 'entryvine_seen_event_';
const MAX_REMEMBERED = 30;

interface EventSnapshot {
  startDate: string;
  performersJson: string;
  extraInfoJson: string;
  seenAt: number;
}

export interface EventDelta {
  dateChanged: boolean;
  lineupChanged: boolean;
  detailsChanged: boolean;
}

export function rememberEventVisit(event: Event): EventDelta | null {
  let delta: EventDelta | null = null;
  try {
    const key = KEY_PREFIX + event.eventsId;
    const raw = localStorage.getItem(key);
    if (raw) {
      const prev = JSON.parse(raw) as EventSnapshot;
      delta = {
        dateChanged: prev.startDate !== event.startDate,
        lineupChanged: prev.performersJson !== event.performersJson,
        detailsChanged: prev.extraInfoJson !== event.extraInfoJson,
      };
      if (!delta.dateChanged && !delta.lineupChanged && !delta.detailsChanged) {
        delta = null;
      }
    }
    const snapshot: EventSnapshot = {
      startDate: event.startDate,
      performersJson: event.performersJson,
      extraInfoJson: event.extraInfoJson,
      seenAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(snapshot));
    pruneOldSnapshots();
  } catch {
    return null;
  }
  return delta;
}

function pruneOldSnapshots(): void {
  const entries: Array<{ key: string; seenAt: number }> = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(KEY_PREFIX)) continue;
    try {
      const snap = JSON.parse(localStorage.getItem(key) ?? '') as EventSnapshot;
      entries.push({ key, seenAt: snap.seenAt ?? 0 });
    } catch {
      localStorage.removeItem(key);
    }
  }
  if (entries.length <= MAX_REMEMBERED) return;
  entries
    .sort((a, b) => a.seenAt - b.seenAt)
    .slice(0, entries.length - MAX_REMEMBERED)
    .forEach((e) => localStorage.removeItem(e.key));
}

export function deltaMessages(delta: EventDelta): string[] {
  const messages: string[] = [];
  if (delta.dateChanged) messages.push('The date or time has changed');
  if (delta.lineupChanged) messages.push('The lineup was updated');
  if (delta.detailsChanged) messages.push('Event details were updated');
  return messages;
}
