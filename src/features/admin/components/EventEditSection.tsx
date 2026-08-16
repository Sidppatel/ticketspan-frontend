import { useCallback, useState } from 'react';
import {
  Building2,
  MapPin,
  Clock,
  Ticket,
  Grid,
  Music,
  Briefcase,
  Users,
  Utensils,
  Laptop,
  Palette,
  HeartHandshake,
  Trophy,
  CalendarDays,
  CalendarCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { cn } from '@/shared/lib/cn';
import {
  setEventFeesIncluded,
  setEventAch,
  updateEvent,
} from '@/features/admin/services/eventAdminService';
import { listVenues } from '@/features/admin/services/catalogService';
import { getMyTenant } from '@/features/admin/services/tenantService';
import type { Event } from '@/shared/proto/event';
import type { Venue } from '@/shared/proto/catalog';

function epochToZonedInput(epochSeconds: number | string, timeZone: string): string {
  const seconds = typeof epochSeconds === 'string' ? Number(epochSeconds) : epochSeconds;
  if (!Number.isFinite(seconds) || seconds === 0) {
    return '';
  }
  const d = new Date(seconds * 1000);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

function zonedInputToEpoch(input: string, timeZone: string): string {
  if (!input) return '0';
  const [datePart, timePart] = input.split('T');
  if (!datePart || !timePart) return '0';
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const [hourStr, minuteStr] = timePart.split(':');
  const targetYear = Number(yearStr);
  const targetMonth = Number(monthStr);
  const targetDay = Number(dayStr);
  const targetHour = Number(hourStr);
  const targetMinute = Number(minuteStr);
  const utcMs = Date.UTC(targetYear, targetMonth - 1, targetDay, targetHour, targetMinute, 0);
  const getOffsetSec = (ms: number) => {
    const d = new Date(ms);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const map: Record<string, string> = {};
    parts.forEach((p) => {
      map[p.type] = p.value;
    });
    const localUtcMs = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
      Number(map.second),
    );
    return Math.round((localUtcMs - ms) / 1000);
  };

  const offsetSec = getOffsetSec(utcMs);
  let realUtcMs = utcMs - offsetSec * 1000;
  const secondOffsetSec = getOffsetSec(realUtcMs);
  if (secondOffsetSec !== offsetSec) {
    realUtcMs = utcMs - secondOffsetSec * 1000;
  }
  return Math.floor(realUtcMs / 1000).toString();
}

function venueLabel(v: Venue): string {
  const parts = [v.name];
  if (v.city || v.state) {
    parts.push(`(${[v.city, v.state].filter(Boolean).join(', ')})`);
  }
  return parts.join(' ');
}

function formatDuration(startInput: string, endInput: string): string {
  if (!startInput || !endInput) return '';
  const startDate = new Date(startInput);
  const endDate = new Date(endInput);
  const diffMs = endDate.getTime() - startDate.getTime();
  if (isNaN(diffMs) || diffMs <= 0) return '';
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const remainingMinutes = totalMinutes % 60;
  if (days > 0) {
    return `${days}d ${remainingHours}h duration`;
  }
  if (hours > 0) {
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''} duration`;
  }
  return `${totalMinutes}m duration`;
}

const CATEGORY_PRESETS = [
  { name: 'Music', icon: Music },
  { name: 'Business', icon: Briefcase },
  { name: 'Social', icon: Users },
  { name: 'Dining', icon: Utensils },
  { name: 'Tech', icon: Laptop },
  { name: 'Arts', icon: Palette },
  { name: 'Family', icon: HeartHandshake },
  { name: 'Sports', icon: Trophy },
];

export function EditSection({
  event,
  timeZone,
  onSaved,
}: {
  event: Event;
  timeZone: string;
  onSaved: () => void;
}) {
  const venuesLoader = useCallback(() => listVenues(), []);
  const venues = useAsync(venuesLoader);
  const tenantLoader = useCallback(() => getMyTenant(), []);
  const tenant = useAsync(tenantLoader);

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [shortDescription, setShortDescription] = useState(event.shortDescription ?? '');
  const [storyDescription, setStoryDescription] = useState(event.storyDescription ?? '');
  const [urgencyBadgeText, setUrgencyBadgeText] = useState(event.urgencyBadgeText ?? '');
  const [isVerifiedOrganizer, setIsVerifiedOrganizer] = useState(event.isVerifiedOrganizer ?? true);
  const [category, setCategory] = useState(event.category);
  const [eventType, setEventType] = useState(event.eventType || 'Open');
  const [layoutMode, setLayoutMode] = useState(event.layoutMode || 'Grid');
  const [venuesId, setVenuesId] = useState(event.venuesId);
  const [startInput, setStartInput] = useState(() => epochToZonedInput(event.startDate, timeZone));
  const [endInput, setEndInput] = useState(() => epochToZonedInput(event.endDate, timeZone));
  const [feesIncluded, setFeesIncluded] = useState(event.feesIncluded);
  const [achEnabled, setAchEnabled] = useState(event.achEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationText = formatDuration(startInput, endInput);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const startDate = zonedInputToEpoch(startInput, timeZone);
      const endDate = zonedInputToEpoch(endInput, timeZone);
      if (Number(endDate) <= Number(startDate)) {
        throw new Error('End date must be strictly after start date');
      }

      await updateEvent(event.eventsId, {
        title,
        slug: event.slug,
        description,
        status: event.status,
        category,
        startDate,
        endDate,
        venuesId,
        layoutMode,
        eventType,
        imagePath: event.imagePath,
        shortDescription,
        storyDescription,
        urgencyBadgeText,
        isVerifiedOrganizer,
      });

      toast.success('Event details saved');
      onSaved();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeesIncluded(next: boolean) {
    setFeesIncluded(next);
    try {
      await setEventFeesIncluded(event.eventsId, next);
      toast.success(next ? 'Fees included in upfront price' : 'Fees added at checkout');
      onSaved();
    } catch (caught) {
      setFeesIncluded(!next);
      toast.error(rpcErrorMessage(caught));
    }
  }

  async function toggleAch(next: boolean) {
    setAchEnabled(next);
    try {
      await setEventAch(event.eventsId, next);
      toast.success(next ? 'ACH payments enabled for event' : 'ACH payments disabled for event');
      onSaved();
    } catch (caught) {
      setAchEnabled(!next);
      toast.error(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building2 className="size-4 text-primary" /> Primary Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="event-title" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Event Title *
            </Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Neon Horizon Music Festival 2026"
              className="h-11 text-base font-medium rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-short-desc" className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Short Teaser / Subtitle</span>
              <span className="text-[10px] text-muted-foreground normal-case font-normal">Shown under title on listing cards</span>
            </Label>
            <Input
              id="event-short-desc"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. 2-day immersive electronic soundscape in downtown Austin"
              className="h-10 text-sm rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Category
            </Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PRESETS.map((cat) => {
                const Icon = cat.icon;
                const active = category.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm scale-102'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Icon className="size-3.5" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-desc" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Main Description
            </Label>
            <Textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Provide event overview, schedule highlights, age restrictions, and essential attendee notes…"
              className="rounded-xl resize-y text-sm leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-story" className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Story & Experience Details</span>
              <span className="text-[10px] text-muted-foreground normal-case font-normal">Expanded section for festival lore, lineup narrative, or FAQs</span>
            </Label>
            <Textarea
              id="event-story"
              value={storyDescription}
              onChange={(e) => setStoryDescription(e.target.value)}
              rows={3}
              placeholder="Tell the complete story behind this event..."
              className="rounded-xl resize-y text-sm leading-relaxed"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="size-4 text-primary" /> Location, Timing & Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="event-venue" className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5" /> Venue *
            </Label>
            <Select
              id="event-venue"
              value={venuesId}
              onChange={(e) => setVenuesId(e.target.value)}
              className="h-11 rounded-xl text-sm"
            >
              <option value="">Select a venue…</option>
              {(venues.data || []).map((v) => (
                <option key={v.venuesId} value={v.venuesId}>
                  {venueLabel(v)}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-start" className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> Start Date & Time *
            </Label>
            <DateTimePicker
              value={startInput}
              onChange={setStartInput}
              timeZone={timeZone}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-end" className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="size-3.5" /> End Date & Time *
              </span>
              {durationText ? (
                <span className="text-[11px] font-mono text-primary font-bold">{durationText}</span>
              ) : null}
            </Label>
            <DateTimePicker
              value={endInput}
              onChange={setEndInput}
              timeZone={timeZone}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-mode" className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Ticket className="size-3.5" /> Ticketing Experience Mode
            </Label>
            <Select
              id="event-mode"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="h-11 rounded-xl text-sm"
            >
              <option value="Open">Open Standing / General Admission</option>
              <option value="Seated">Reserved Table / Booth Seating</option>
              <option value="Hybrid">Hybrid (Reserved Tables + GA Passes)</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-layout" className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Grid className="size-3.5" /> Layout Display
            </Label>
            <Select
              id="event-layout"
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value)}
              className="h-11 rounded-xl text-sm"
            >
              <option value="Grid">Visual Interactive Seating Grid</option>
              <option value="FloorPlan">Architectural Floor Plan Blueprint</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency-text" className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Urgency Badge Text</span>
              <span className="text-[10px] text-muted-foreground normal-case font-normal">e.g. Almost Sold Out, VIP Limited</span>
            </Label>
            <Input
              id="urgency-text"
              value={urgencyBadgeText}
              onChange={(e) => setUrgencyBadgeText(e.target.value)}
              placeholder="e.g. VIP 80% Claimed"
              className="h-10 text-sm rounded-xl"
            />
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-muted/20 flex flex-col justify-center">
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-primary"
                checked={isVerifiedOrganizer}
                onChange={(e) => setIsVerifiedOrganizer(e.target.checked)}
              />
              <span>
                <span className="font-bold text-sm block">Verified Organizer Badge</span>
                <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Highlights verified host credentials on public event pages.
                </span>
              </span>
            </label>
            <p className="text-[11px] text-muted-foreground mt-1">Displays a blue trust badge on ticket pages.</p>
          </div>

          <div className="md:col-span-2 p-4 rounded-xl border border-border/50 bg-muted/20 space-y-4">
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-primary"
                checked={feesIncluded}
                onChange={(e) => toggleFeesIncluded(e.target.checked)}
              />
              <span>
                <span className="font-bold text-sm block">Show fees included in price</span>
                <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  On = buyers see one all-in total upfront. Off = base price + fee breakdown shown at checkout.
                </span>
              </span>
            </label>
            {tenant.data?.achEnabled ? (
              <label className="flex items-start gap-3 text-sm cursor-pointer border-t border-border/20 pt-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-primary"
                  checked={achEnabled}
                  onChange={(e) => toggleAch(e.target.checked)}
                />
                <span>
                  <span className="font-bold text-sm block">Offer ACH (bank debit) payment option</span>
                  <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Buyers can pay via US bank debit for lower transaction fees on high-ticket orders.
                  </span>
                </span>
              </label>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 leading-normal animate-shake">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-border/20 pt-4">
        <Button onClick={save} disabled={saving} className="ticketspan-spring-btn h-12 px-10 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25">
          {saving ? 'Saving changes…' : 'Save all basics & details'}
        </Button>
      </div>
    </div>
  );
}
