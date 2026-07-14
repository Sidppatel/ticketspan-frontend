export interface DemoOrganizer {
  slug: string;
  name: string;
  owner: string;
  tagline: string;
  emoji: string;
  followers: number;
}

export interface DemoEvent {
  id: string;
  organizerSlug: string;
  title: string;
  emoji: string;
  venue: string;
  city: string;
  startsAt: number;
  endsAt: number;
  capacity: number;
  sold: number;
  priceFromCents: number;
  revenueCents: number;
  status: 'published' | 'draft';
  virtual: boolean;
}

export type DemoEventFilter = 'all' | 'upcoming' | 'past' | 'virtual' | 'draft';

export interface DemoEventInput {
  title: string;
  venue: string;
  city: string;
  startsAt: number;
  capacity: number;
  priceFromCents: number;
  status: 'published' | 'draft';
  virtual: boolean;
}

export interface DemoOrganizerStats {
  eventCount: number;
  totalSold: number;
  totalRevenueCents: number;
  monthRevenueCents: number;
  avgTicketCents: number;
  followers: number;
  revenueByMonth: { label: string; cents: number }[];
}

const STORAGE_KEY = 'entryvine_demo_organizer_db_v1';
const DAY = 86400;

function at(daysFromNow: number, durationDays = 1): { startsAt: number; endsAt: number } {
  const startsAt = Math.floor(Date.now() / 1000) + daysFromNow * DAY;
  return { startsAt, endsAt: startsAt + durationDays * DAY };
}

export const demoOrganizers: DemoOrganizer[] = [
  {
    slug: 'zen-yoga-studio',
    name: 'Zen Yoga Studio',
    owner: 'Sarah Johnson',
    tagline: 'Mindful events for a mindful community.',
    emoji: '🧘',
    followers: 234,
  },
  {
    slug: 'harmony-music-festival',
    name: 'Harmony Music Festival',
    owner: 'Alex Rivera',
    tagline: 'Live music that brings people together.',
    emoji: '🎸',
    followers: 1892,
  },
  {
    slug: 'grand-conference-center',
    name: 'The Grand Conference Center',
    owner: 'David Park',
    tagline: 'Where big ideas meet bigger rooms.',
    emoji: '🏛️',
    followers: 567,
  },
];

function seedEvents(): DemoEvent[] {
  let n = 0;
  const make = (
    organizerSlug: string,
    title: string,
    emoji: string,
    venue: string,
    city: string,
    days: number,
    duration: number,
    capacity: number,
    sold: number,
    priceFromCents: number,
    status: 'published' | 'draft' = 'published',
    virtual = false,
  ): DemoEvent => ({
    id: `seed-${++n}`,
    organizerSlug,
    title,
    emoji,
    venue,
    city,
    ...at(days, duration),
    capacity,
    sold,
    priceFromCents,
    revenueCents: sold * priceFromCents,
    status,
    virtual,
  });

  return [
    make('zen-yoga-studio', 'Community Yoga in the Park', '🧘', 'Riverside Park', 'Austin, TX', 11, 1, 30, 12, 1500),
    make('zen-yoga-studio', 'Wellness Weekend Retreat', '🌿', 'Hill Country Retreat Center', 'Wimberley, TX', 60, 3, 20, 8, 24500),
    make('zen-yoga-studio', 'Sunrise Meditation Series', '🌅', 'The Zen Studio', 'Austin, TX', 25, 1, 40, 31, 2000),
    make('zen-yoga-studio', 'Virtual Breathwork Basics', '💨', 'Online', 'Virtual', 8, 1, 100, 64, 900, 'published', true),
    make('zen-yoga-studio', 'Restorative Yoga Evening', '🕯️', 'The Zen Studio', 'Austin, TX', -20, 1, 35, 35, 1800),
    make('zen-yoga-studio', 'Spring Detox Workshop', '🥗', 'The Zen Studio', 'Austin, TX', -75, 1, 25, 21, 4500),
    make('zen-yoga-studio', 'Teacher Training Info Night', '📋', 'The Zen Studio', 'Austin, TX', 40, 1, 50, 0, 0, 'draft'),
    make('zen-yoga-studio', 'Full Moon Flow', '🌕', 'Riverside Park', 'Austin, TX', -6, 1, 45, 39, 1500),
    make('harmony-music-festival', 'Summer Music Festival', '🎪', 'Central Park', 'New York, NY', 40, 3, 200, 47, 4500),
    make('harmony-music-festival', 'Jazz Night at The Blue Room', '🎷', 'The Blue Room', 'New York, NY', 37, 1, 50, 32, 3500),
    make('harmony-music-festival', 'Acoustic Sessions Vol. 4', '🎻', 'The Loft', 'Brooklyn, NY', 15, 1, 80, 55, 2500),
    make('harmony-music-festival', 'Live-Streamed Album Launch', '📀', 'Online', 'Virtual', 22, 1, 500, 210, 1200, 'published', true),
    make('harmony-music-festival', 'Winter Warm-Up Concert', '🔥', 'The Blue Room', 'New York, NY', -140, 1, 60, 58, 3000),
    make('harmony-music-festival', 'Battle of the Bands', '🥁', 'Warehouse 9', 'Queens, NY', 70, 1, 300, 0, 2000, 'draft'),
    make('grand-conference-center', 'Future of Work Summit', '💼', 'Grand Hall A', 'Chicago, IL', 55, 2, 400, 182, 19900),
    make('grand-conference-center', 'Startup Pitch Night', '🚀', 'Innovation Lab', 'Chicago, IL', 18, 1, 120, 96, 2500),
    make('grand-conference-center', 'AI in Healthcare Webinar', '🩺', 'Online', 'Virtual', 9, 1, 1000, 412, 0, 'published', true),
    make('grand-conference-center', 'Annual Leadership Gala', '🥂', 'Grand Ballroom', 'Chicago, IL', -35, 1, 250, 244, 15000),
    make('grand-conference-center', 'Data Engineering Bootcamp', '📊', 'Training Suite 2', 'Chicago, IL', 90, 5, 40, 6, 89900),
    make('grand-conference-center', 'Q4 Trade Expo', '🏢', 'Exhibition Wing', 'Chicago, IL', 130, 2, 800, 0, 7500, 'draft'),
  ];
}

function loadEvents(): DemoEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as DemoEvent[];
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  const seeded = seedEvents();
  saveEvents(seeded);
  return seeded;
}

function saveEvents(events: DemoEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function resetDemoDb(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDemoOrganizer(slug: string): DemoOrganizer | null {
  return demoOrganizers.find((o) => o.slug === slug) ?? null;
}

export function listDemoEvents(
  organizerSlug: string,
  filter: DemoEventFilter,
  search: string,
  includeDrafts: boolean,
): DemoEvent[] {
  const now = Math.floor(Date.now() / 1000);
  const term = search.trim().toLowerCase();
  return loadEvents()
    .filter((e) => e.organizerSlug === organizerSlug)
    .filter((e) => (includeDrafts ? true : e.status === 'published'))
    .filter((e) => {
      if (filter === 'upcoming') return e.status === 'published' && e.endsAt >= now;
      if (filter === 'past') return e.status === 'published' && e.endsAt < now;
      if (filter === 'virtual') return e.virtual;
      if (filter === 'draft') return e.status === 'draft';
      return true;
    })
    .filter((e) => !term || e.title.toLowerCase().includes(term) || e.venue.toLowerCase().includes(term))
    .sort((a, b) => b.startsAt - a.startsAt);
}

export function createDemoEvent(organizerSlug: string, input: DemoEventInput): DemoEvent {
  const event: DemoEvent = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    organizerSlug,
    emoji: '🎟️',
    endsAt: input.startsAt + DAY,
    sold: 0,
    revenueCents: 0,
    ...input,
  };
  saveEvents([...loadEvents(), event]);
  return event;
}

export function updateDemoEvent(id: string, input: DemoEventInput): void {
  saveEvents(
    loadEvents().map((e) =>
      e.id === id ? { ...e, ...input, endsAt: Math.max(input.startsAt + DAY, e.endsAt) } : e,
    ),
  );
}

export function deleteDemoEvent(id: string): void {
  saveEvents(loadEvents().filter((e) => e.id !== id));
}

export function getDemoOrganizerStats(organizerSlug: string): DemoOrganizerStats {
  const organizer = getDemoOrganizer(organizerSlug);
  const events = loadEvents().filter((e) => e.organizerSlug === organizerSlug && e.status === 'published');
  const totalSold = events.reduce((sum, e) => sum + e.sold, 0);
  const totalRevenueCents = events.reduce((sum, e) => sum + e.revenueCents, 0);

  const now = new Date();
  const months: { label: string; cents: number; key: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('en-US', { month: 'short' }),
      cents: 0,
      key: `${d.getFullYear()}-${d.getMonth()}`,
    });
  }
  for (const e of events) {
    const d = new Date(e.startsAt * 1000);
    const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) {
      bucket.cents += e.revenueCents;
    }
  }

  return {
    eventCount: events.length,
    totalSold,
    totalRevenueCents,
    monthRevenueCents: months[months.length - 1].cents,
    avgTicketCents: totalSold > 0 ? Math.round(totalRevenueCents / totalSold) : 0,
    followers: organizer?.followers ?? 0,
    revenueByMonth: months.map(({ label, cents }) => ({ label, cents })),
  };
}

export function daysLeftLabel(startsAt: number): string {
  const days = Math.ceil((startsAt * 1000 - Date.now()) / (DAY * 1000));
  if (days < 0) return 'Ended';
  if (days === 0) return 'Today';
  return `${days} day${days === 1 ? '' : 's'} left`;
}

export function soldPercent(sold: number, capacity: number): number {
  return capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
}

export function monthBarPercents(revenueByMonth: { label: string; cents: number }[]): number[] {
  const max = Math.max(1, ...revenueByMonth.map((m) => m.cents));
  return revenueByMonth.map((m) => Math.round((m.cents / max) * 100));
}

export function epochToDateInput(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

export function dateInputToEpoch(value: string): number {
  const ms = new Date(`${value}T10:00:00`).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : Math.floor(Date.now() / 1000);
}
