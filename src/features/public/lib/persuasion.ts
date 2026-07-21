import type { Event } from '@/shared/proto/event';
import { countdownParts } from './discover';

export type Heat = 'soldOut' | 'hot' | 'warm' | 'open';

export interface Persuasion {
  heat: Heat;
  headline: string;
  subline: string;
  ctaLabel: string;
  stickyLabel: string;
  seatsLeft: number | null;
  startsInLabel: string | null;
  reassurance: string[];
}

interface Tier {
  capacity: number;
  soldCount: number;
}

function seatsRemaining(tiers: Tier[]): number | null {
  const capped = tiers.filter((t) => t.capacity > 0);
  if (capped.length === 0) return null;
  let left = 0;
  for (const t of capped) {
    const tierLeft = t.capacity - t.soldCount;
    if (tierLeft > 0) left += tierLeft;
  }
  return left;
}

function claimedFraction(tiers: Tier[]): number | null {
  const capped = tiers.filter((t) => t.capacity > 0);
  if (capped.length === 0) return null;
  let cap = 0;
  let sold = 0;
  for (const t of capped) {
    cap += t.capacity;
    sold += t.soldCount;
  }
  return cap > 0 ? sold / cap : null;
}

function startsInLabel(event: Event): string | null {
  const p = countdownParts(event.startDate, event.endDate);
  if (p.live) return 'happening now';
  if (p.past) return null;
  if (p.days >= 2) return `in ${p.days} days`;
  if (p.days === 1) return 'tomorrow';
  if (p.hours >= 1) return `in ${p.hours} ${p.hours === 1 ? 'hour' : 'hours'}`;
  return 'in minutes';
}

export function buildPersuasion(event: Event, tiers: Tier[]): Persuasion {
  const seatsLeft = seatsRemaining(tiers);
  const claimed = claimedFraction(tiers);
  const startsIn = startsInLabel(event);
  const soon = startsIn === 'tomorrow' || startsIn === 'in minutes' || /^in \d+ hours?$/.test(startsIn ?? '');

  const reassurance = ['Secure checkout', 'Tickets land in your inbox instantly', 'Takes about 30 seconds'];

  let heat: Heat = 'open';
  if (seatsLeft === 0) heat = 'soldOut';
  else if ((seatsLeft !== null && seatsLeft <= 20) || (claimed !== null && claimed >= 0.85) || soon) heat = 'hot';
  else if ((claimed !== null && claimed >= 0.5) || startsIn?.startsWith('in ')) heat = 'warm';

  const left = seatsLeft ?? 0;

  switch (heat) {
    case 'soldOut':
      return {
        heat,
        headline: 'Every seat is claimed.',
        subline:
          "This one filled up — you've got great taste. Check below for tables or another tier that may still be open.",
        ctaLabel: 'See what’s left',
        stickyLabel: 'Sold out — check remaining options',
        seatsLeft: 0,
        startsInLabel: startsIn,
        reassurance,
      };
    case 'hot':
      return {
        heat,
        headline: 'Don’t overthink this one.',
        subline:
          seatsLeft !== null
            ? `Only ${left} ${left === 1 ? 'seat' : 'seats'} left${startsIn ? `, and doors open ${startsIn}` : ''}. They’re going fast — lock yours in before someone else does.`
            : `Doors open ${startsIn}. The good spots always go first — grab yours now.`,
        ctaLabel: 'Grab my seats',
        stickyLabel: seatsLeft !== null ? `${left} seats left — grab yours` : 'Filling fast — grab your seats',
        seatsLeft,
        startsInLabel: startsIn,
        reassurance,
      };
    case 'warm':
      return {
        heat,
        headline: 'The good spots always go first.',
        subline:
          "You found this early — smart move. Pick your tickets while the best seats are still on the table.",
        ctaLabel: 'Choose my tickets',
        stickyLabel: seatsLeft !== null ? `${left} seats left — choose yours` : 'Choose your tickets',
        seatsLeft,
        startsInLabel: startsIn,
        reassurance,
      };
    default:
      return {
        heat,
        headline: 'Come be in the room.',
        subline:
          'This is going to be a night. Grab your tickets and make it yours — we’ll hold them the second you pick.',
        ctaLabel: 'Get my tickets',
        stickyLabel: 'Ready when you are — get tickets',
        seatsLeft,
        startsInLabel: startsIn,
        reassurance,
      };
  }
}
