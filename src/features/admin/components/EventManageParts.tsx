import { useCallback, useState } from 'react';
import {
  Building2,
  Sparkles,
  Info,
  MapPin,
  Clock,
  Ticket,
  Grid,
  Layers,
  Check,
  BookOpen,
  Zap,
  ShieldCheck,
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
  Globe,
  Copy,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
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
import type { EventCompletion, EventVoice, SectionId } from '@/features/admin/lib/eventInsights';
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

export function VoiceZone({
  event,
  voice,
  completion,
  startLabel,
  venueName,
  previewHref,
  onPublish,
  onRevert,
  onCopyLink,
}: {
  event: Event;
  voice: EventVoice;
  completion: EventCompletion;
  startLabel: string | null;
  venueName: string | null;
  previewHref: string | null;
  onPublish: () => void;
  onRevert: () => void;
  onCopyLink: () => void;
}) {
  const isPublished = event.status === 'Published';
  return (
    <Card className="border border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={isPublished ? 'success' : 'warn'} className="font-bold text-[10px] uppercase">
                {isPublished ? 'Live & Published' : 'Draft Mode'}
              </Badge>
              <Badge variant="neutral" className="font-mono text-[10px]">
                {completion.percent}% Complete
              </Badge>
              <span className="text-xs font-semibold text-muted-foreground">{voice.headline}</span>
            </div>
            <h2 className="text-xl font-extrabold font-display text-foreground tracking-tight">
              {event.title || 'Untitled Event'}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{startLabel}</span>
              {venueName ? <span>• {venueName}</span> : null}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {previewHref ? (
              <a href={previewHref} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="h-9 text-xs font-bold gap-1.5">
                  <Globe className="size-3.5" /> Public View
                </Button>
              </a>
            ) : null}
            <Button size="sm" variant="outline" onClick={onCopyLink} className="h-9 text-xs font-bold gap-1.5">
              <Copy className="size-3.5" /> Copy Link
            </Button>
            {isPublished ? (
              <Button size="sm" variant="outline" onClick={onRevert} className="h-9 text-xs font-bold">
                Unpublish
              </Button>
            ) : (
              <Button size="sm" onClick={onPublish} className="ticketspan-spring-btn h-9 px-4 text-xs font-bold">
                Publish Event
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WhatsNext({
  completion,
  published,
  onOpen,
  onPublish,
}: {
  completion: EventCompletion;
  published: boolean;
  onOpen: (section: SectionId) => void;
  onPublish: () => void;
}) {
  if (published || completion.canPublish) return null;
  return (
    <Card className="border border-amber-500/30 bg-amber-500/5 shadow-sm rounded-2xl overflow-hidden p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5 font-display">
            <Sparkles className="size-4" /> Next Steps to Publish
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {completion.missing.map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (item.toLowerCase().includes('ticket')) onOpen('pricing');
                  else if (item.toLowerCase().includes('table')) onOpen('layout');
                  else if (item.toLowerCase().includes('staff')) onOpen('staff');
                  else onOpen('basics');
                }}
                className="text-[11px] font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                + Add {item}
              </button>
            ))}
          </div>
        </div>
        {completion.missing.length === 0 ? (
          <Button size="sm" onClick={onPublish} className="ticketspan-spring-btn h-9 px-5 text-xs font-bold rounded-xl shadow-md">
            Publish Now
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

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
  const [venuesId, setVenuesId] = useState(event.venuesId);
  const [feesIncluded, setFeesIncluded] = useState(event.feesIncluded);
  const [achEnabled, setAchEnabled] = useState(event.achEnabled);
  const [start, setStart] = useState(epochToZonedInput(event.startDate, timeZone));
  const [end, setEnd] = useState(epochToZonedInput(event.endDate, timeZone));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationStr = formatDuration(start, end);
  const venueList = venues.data ?? [];
  const selectedVenue = venueList.find((v) => v.venuesId === venuesId);

  async function toggleFeesIncluded(next: boolean) {
    setFeesIncluded(next);
    try {
      await setEventFeesIncluded(event.eventsId, next);
      toast.success('Fee display preference updated');
    } catch (caught) {
      setFeesIncluded(!next);
      setError(rpcErrorMessage(caught));
    }
  }

  async function toggleAch(next: boolean) {
    setAchEnabled(next);
    try {
      await setEventAch(event.eventsId, next);
      toast.success('Bank ACH payment option updated');
    } catch (caught) {
      setAchEnabled(!next);
      setError(rpcErrorMessage(caught));
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateEvent(event.eventsId, {
        title,
        slug: event.slug,
        description,
        shortDescription,
        storyDescription,
        urgencyBadgeText,
        isVerifiedOrganizer,
        heroBackdropImageId: event.heroBackdropImageId ?? '',
        posterImageId: event.posterImageId ?? '',
        status: event.status,
        category,
        startDate: zonedInputToEpoch(start, timeZone),
        endDate: zonedInputToEpoch(end, timeZone),
        layoutMode: eventType === 'Open' ? 'Open' : 'Grid',
        eventType,
        venuesId,
        imagePath: event.imagePath,
      });
      toast.success('All event details saved successfully');
      onSaved();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
        <CardHeader className="border-b border-border/20 px-6 py-5 flex flex-row items-center justify-between gap-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold font-display text-foreground tracking-tight">
                Event Logistics & Identity
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Core identity details, physical venue jurisdiction, and schedule window
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full shadow-sm">
              Step 1 • Core Identity
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" /> Event Title
              </Label>
              <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                {title.length}/100 chars
              </span>
            </div>
            <div className="relative group">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Gulf Coast Summer Music Festival 2026"
                className="h-12 bg-background border-border text-base font-bold px-4 rounded-xl shadow-inner transition-all focus-within:ring-2 focus-within:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-lg border border-border/40">
              <Info className="size-3.5 text-primary shrink-0" />
              <span>Public headline name shown across search cards, tickets, and Google metadata.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-foreground">Category Discovery Tag</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CATEGORY_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = category.toLowerCase() === preset.name.toLowerCase();
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setCategory(preset.name)}
                      className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                          : 'bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className="size-3" />
                      {preset.name}
                    </button>
                  );
                })}
              </div>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="category-suggestions"
                placeholder="Select preset above or type custom category"
                className="h-10 bg-background border-border text-sm font-semibold rounded-xl"
              />
              <datalist id="category-suggestions">
                {CATEGORY_PRESETS.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Venue & Location</span>
                {selectedVenue ? (
                  <span className="text-[10px] font-mono text-primary flex items-center gap-1">
                    <MapPin className="size-3" /> {selectedVenue.city}, {selectedVenue.state}
                  </span>
                ) : null}
              </Label>
              <Select value={venuesId} onChange={(e) => setVenuesId(e.target.value)} className="h-10 bg-background border-border text-sm font-semibold rounded-xl">
                <option value="">— select venue location —</option>
                {venueList
                  .filter((v) => v.isActive || v.venuesId === venuesId)
                  .map((v) => (
                    <option key={v.venuesId} value={v.venuesId}>
                      {venueLabel(v)}
                    </option>
                  ))}
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Determines physical address on tickets, map pin coordinates, and local sales tax calculations.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <Label className="text-xs font-bold text-foreground">Event Layout & Seating Architecture</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'Open',
                  title: 'Open Seating',
                  desc: 'GA & Ticket Tiers Only',
                  icon: Ticket,
                },
                {
                  id: 'Table',
                  title: 'Table Reserved',
                  desc: 'Interactive Floor Plan Tables',
                  icon: Grid,
                },
                {
                  id: 'Both',
                  title: 'Hybrid Seating',
                  desc: 'GA Tiers + Floor Plan Tables',
                  icon: Layers,
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = eventType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEventType(item.id)}
                    className={cn(
                      'p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 relative',
                      active
                        ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
                        : 'bg-muted/10 border-border/60 hover:bg-muted/30 text-muted-foreground',
                    )}
                  >
                    <div className={cn('p-2 rounded-lg shrink-0', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                      <Icon className="size-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        {item.title}
                        {active ? <Check className="size-3.5 text-primary" /> : null}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 p-4 rounded-xl border border-border/60 bg-muted/10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CalendarDays className="size-4 text-primary" /> Event Schedule Window
              </Label>
              <div className="flex items-center gap-2">
                {durationStr ? (
                  <span className="text-[11px] font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    {durationStr}
                  </span>
                ) : null}
                <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/40">
                  Timezone: {timeZone}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <span className="block text-[11px] font-bold text-foreground flex items-center gap-1">
                  <Clock className="size-3 text-emerald-500" /> Doors Open & Start Time
                </span>
                <DateTimePicker value={start} onChange={setStart} timeZone={timeZone} />
              </div>

              <div className="space-y-1.5">
                <span className="block text-[11px] font-bold text-foreground flex items-center gap-1">
                  <CalendarCheck className="size-3 text-rose-500" /> Event End Time
                </span>
                <DateTimePicker value={end} onChange={setEnd} timeZone={timeZone} fallbackDate={start} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/20 px-6 py-4 flex flex-row items-center justify-between gap-2 bg-muted/10">
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-primary" /> Story, Copywriting & Vision
          </CardTitle>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            Recommended
          </span>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Short Description (Hero Teaser)</Label>
            <Input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Concise 1-2 sentence hook for the hero poster card"
              className="h-10 bg-background border-border text-sm"
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="size-3 text-primary shrink-0" /> Hooks buyers in 3 seconds directly on the Magazine Hero Header.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Main Overview Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Primary event overview text"
              className="min-h-20 bg-background border-border text-sm"
            />
            <p className="text-[11px] text-muted-foreground">Displayed in key overview sections and search previews.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">The Story & Event Vision (Long Details)</Label>
            <Textarea
              value={storyDescription}
              onChange={(e) => setStoryDescription(e.target.value)}
              placeholder="In-depth backstory, VIP experience expectations, and exclusive festival vision"
              rows={5}
              className="min-h-28 bg-background border-border text-sm"
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="size-3 text-primary shrink-0" /> Powers "The Story & Event Vision" bento box on the public page.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/20 px-6 py-4 flex flex-row items-center justify-between gap-2 bg-muted/10">
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Zap className="h-4.5 w-4.5 text-primary" /> Trust Badges & Conversion Drivers
          </CardTitle>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            Conversion Boosters
          </span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2 p-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Urgency Badge Text</Label>
            <Input
              value={urgencyBadgeText}
              onChange={(e) => setUrgencyBadgeText(e.target.value)}
              placeholder="e.g. High Demand, Selling Fast, Only 40 VIP Passes Left"
              className="h-10 bg-background border-border text-sm font-semibold"
            />
            <p className="text-[11px] text-muted-foreground">Creates psychological scarcity pill on hero poster.</p>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-center gap-3 h-10 px-4 border border-border/60 bg-muted/20 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={isVerifiedOrganizer}
                onChange={(e) => setIsVerifiedOrganizer(e.target.checked)}
                className="size-4 accent-primary"
              />
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" /> Verified Organizer Badge
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

export function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <Card className={cn('relative overflow-hidden border border-border shadow-sm rounded-2xl', accent && 'border-amber/40 bg-amber/5')}>
      <CardContent className="space-y-2 p-6">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-10 items-center justify-center rounded-xl [&_svg]:size-5 shadow-sm border border-black/5',
              accent ? 'bg-amber/20 text-amber' : 'bg-primary/10 text-primary',
            )}
          >
            <Icon />
          </span>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{label}</p>
        </div>
        <p className="font-display text-3xl font-extrabold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
