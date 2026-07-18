import { useCallback, useState, useEffect } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { updateEvent, setEventFeesIncluded, setEventAch, generateEventInfo, getAiSettings, type GenerateEventInfoResponse } from '@/features/admin/services/eventAdminService';
import { listVenues } from '@/features/admin/services/catalogService';
import { venueLabel } from '@/features/admin/pages/AdminVenuesPage';
import { getMyTenant } from '@/features/admin/services/tenantService';
import { epochToZonedInput, zonedInputToEpoch } from '@/shared/lib/timezone';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import type { Event } from '@/shared/proto/event';
import { rpcErrorMessage } from '@/shared/session';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Select } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import {
  FileEdit,
  Rocket,
  Undo2,
  Link2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import type { Tone, SectionId, ChecklistItem, EventCompletion, EventVoice } from '@/features/admin/lib/eventInsights';

function formatAiValue(field: string, val: string) {
  if ((field === 'startDate' || field === 'endDate') && val.includes('T')) {
    const [datePart, timePart] = val.split('T');
    if (timePart) {
      const [hourStr, minStr] = timePart.split(':');
      let hours = parseInt(hourStr, 10);
      if (!isNaN(hours)) {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHour = String(hours).padStart(2, '0');
        return `${datePart}, ${formattedHour}:${minStr} ${ampm}`;
      }
    }
  }
  return val;
}

const STATUS_STYLES: Record<string, string> = {
  Published: 'bg-success/15 text-success ring-success/30',
  Draft: 'bg-amber/15 text-amber-foreground ring-amber/30',
  Cancelled: 'bg-destructive/15 text-destructive ring-destructive/30',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset',
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground ring-border',
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function toneClasses(tone: Tone): string {
  switch (tone) {
    case 'success':
      return 'bg-success/10 text-success';
    case 'gold':
      return 'bg-amber/10 text-amber-foreground';
    case 'muted':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-primary/10 text-primary';
  }
}

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
  hasTicketsSold = false,
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
  hasTicketsSold?: boolean;
}) {
  const published = event.status === 'Published';
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-3">
            <StatusPill status={event.status} />
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">{event.title || 'Untitled event'}</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {event.eventType || 'Open'} event · {event.category || 'Uncategorised'}
              {startLabel ? <> · {startLabel}</> : null}
              {venueName ? <> · {venueName}</> : null}
            </p>
            <p className={cn('inline-block rounded-xl px-3.5 py-2 text-base font-semibold leading-snug', toneClasses(voice.tone))}>
              {voice.headline}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {!published ? (
              <Button
                size="sm"
                className="ticketspan-spring-btn h-9 rounded-lg px-4 text-xs font-bold"
                disabled={!completion.canPublish}
                title={completion.canPublish ? 'Publish this event' : `Before publishing: ${completion.missing.join(', ')}`}
                onClick={onPublish}
              >
                <Rocket className="mr-1 h-4 w-4" /> Publish
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-lg border-border bg-background px-4 text-xs font-bold"
                disabled={hasTicketsSold}
                title={hasTicketsSold ? 'This event has tickets sold and cannot be reverted to draft' : 'Revert to draft'}
                onClick={onRevert}
              >
                <Undo2 className="mr-1 h-4 w-4" /> Revert to draft
              </Button>
            )}
            {previewHref ? (
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-lg border-border bg-background px-4 text-xs font-bold"
                onClick={() => window.open(previewHref, '_blank', 'noreferrer')}
              >
                <ExternalLink className="mr-1 h-4 w-4" /> Preview
              </Button>
            ) : null}
            <Button size="sm" variant="outline" className="h-9 rounded-lg border-border bg-background px-4 text-xs font-bold" onClick={onCopyLink}>
              <Link2 className="mr-1 h-4 w-4" /> Copy link
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>{completion.percent === 100 ? 'Everything’s in place 🎉' : 'Setup progress'}</span>
            <span className="tabular-nums">{completion.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
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
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-6 md:p-8 space-y-5">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </span>
        <h2 className="font-display text-lg font-bold">What’s next?</h2>
        <span className="ml-auto text-xs font-semibold text-muted-foreground tabular-nums">{completion.percent}% complete</span>
      </div>
      <ul className="space-y-1">
        {completion.items.map((item: ChecklistItem) => (
          <li key={item.id}>
            <button
              onClick={() => onOpen(item.section)}
              disabled={item.done}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                item.done ? 'text-muted-foreground' : 'font-semibold hover:bg-background',
              )}
            >
              {item.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              ) : item.weight === 'critical' ? (
                <AlertCircle className="size-4 shrink-0 text-amber-foreground" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className={cn(item.done && 'line-through')}>{item.label}</span>
              {!item.done && item.weight === 'critical' ? (
                <span className="ml-1 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-foreground">
                  Required
                </span>
              ) : null}
              {!item.done ? <ArrowRight className="ml-auto size-3.5 text-muted-foreground" /> : null}
            </button>
          </li>
        ))}
      </ul>
      {!published ? (
        <div className="border-t border-border/40 pt-5">
          <Button
            size="lg"
            className="ticketspan-spring-btn h-12 w-full rounded-xl text-sm font-bold uppercase tracking-wider shadow-md shadow-primary/20 sm:w-auto sm:px-10"
            disabled={!completion.canPublish}
            title={completion.canPublish ? 'Publish this event' : 'Add a ticket type or a table first'}
            onClick={onPublish}
          >
            <Rocket className="mr-2 h-4 w-4" /> Publish event now
          </Button>
        </div>
      ) : null}
    </div>
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
  const [category, setCategory] = useState(event.category);
  const [eventType, setEventType] = useState(event.eventType || 'Open');
  const [venuesId, setVenuesId] = useState(event.venuesId);
  const [feesIncluded, setFeesIncluded] = useState(event.feesIncluded);
  const [achEnabled, setAchEnabled] = useState(event.achEnabled);
  const [start, setStart] = useState(epochToZonedInput(event.startDate, timeZone));
  const [end, setEnd] = useState(epochToZonedInput(event.endDate, timeZone));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiErrorMsg, setAiErrorMsg] = useState<string | null>(null);
  const [aiPromptLimit, setAiPromptLimit] = useState(200);

  const [aiStep, setAiStep] = useState<'prompt' | 'review'>('prompt');
  const [aiResult, setAiResult] = useState<GenerateEventInfoResponse | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

  useEffect(() => {
    getAiSettings()
      .then((settings) => setAiPromptLimit(settings.promptMaxLength))
      .catch((caught) => console.error('Failed to load AI settings', caught));
  }, []);

  async function handleGenerate() {
    if (!aiPrompt.trim()) return;
    setAiErrorMsg(null);
    setIsGenerating(true);
    try {
      const result = await generateEventInfo(aiPrompt);
      setAiResult(result);
      setAiStep('review');
    } catch (caught) {
      setAiErrorMsg(rpcErrorMessage(caught));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerateField(field: 'title' | 'description' | 'category' | 'startDate' | 'endDate') {
    if (!aiResult) return;
    setIsRegenerating(field);
    setAiErrorMsg(null);
    try {
      const result = await generateEventInfo(aiPrompt, field);
      setAiResult({ ...aiResult, [field]: result[field] });
    } catch (caught) {
      setAiErrorMsg(rpcErrorMessage(caught));
    } finally {
      setIsRegenerating(null);
    }
  }



  function handleFillField(field: 'title' | 'description' | 'category' | 'startDate' | 'endDate', val: string) {
    if (field === 'title') setTitle(val);
    if (field === 'description') setDescription(val);
    if (field === 'category') setCategory(val);
    if (field === 'startDate') setStart(val);
    if (field === 'endDate') setEnd(val);
    
    if (aiResult) {
      const nextResult = { ...aiResult, [field]: '' };
      setAiResult(nextResult);
      if (!nextResult.title && !nextResult.description && !nextResult.category && !nextResult.startDate && !nextResult.endDate) {
        setIsAiModalOpen(false);
        resetAiState();
      }
    }
  }

  function handleFillAll() {
    if (!aiResult) return;
    if (aiResult.title) setTitle(aiResult.title);
    if (aiResult.description) setDescription(aiResult.description);
    if (aiResult.category) setCategory(aiResult.category);
    if (aiResult.startDate) setStart(aiResult.startDate);
    if (aiResult.endDate) setEnd(aiResult.endDate);
    
    setIsAiModalOpen(false);
    resetAiState();
  }

  function resetAiState() {
    setAiPrompt('');
    setAiStep('prompt');
    setAiResult(null);
    setAiErrorMsg(null);
    setIsRegenerating(null);
  }

  async function toggleFeesIncluded(next: boolean) {
    setFeesIncluded(next);
    try {
      await setEventFeesIncluded(event.eventsId, next);
    } catch (caught) {
      setFeesIncluded(!next);
      setError(rpcErrorMessage(caught));
    }
  }

  async function toggleAch(next: boolean) {
    setAchEnabled(next);
    try {
      await setEventAch(event.eventsId, next);
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
        status: event.status,
        category,
        startDate: zonedInputToEpoch(start, timeZone),
        endDate: zonedInputToEpoch(end, timeZone),
        layoutMode: eventType === 'Open' ? 'Open' : 'Grid',
        eventType,
        venuesId,
        imagePath: event.imagePath,
      });
      onSaved();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/20 px-6 py-4 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <FileEdit className="h-4.5 w-4.5 text-primary" /> Edit Details
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            className="h-8 gap-2 text-primary border-primary/20 hover:bg-primary/10"
          >
            <Wand2 className="h-4 w-4" /> Magic Autofill
          </Button>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Capacity {event.totalCapacity}
        </span>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 p-6">
        <div className="space-y-1.5">
          <Label className="text-[10px]">Title</Label>
          <div className="ticketspan-spring-input">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 bg-background border-border text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">Category</Label>
          <div className="ticketspan-spring-input">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="category-suggestions"
              className="h-10 bg-background border-border text-sm"
            />
            <datalist id="category-suggestions">
              {['Music', 'Business', 'Social', 'Dining', 'Tech', 'Arts', 'Family', 'Sports'].map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">Venue</Label>
          <Select value={venuesId} onChange={(e) => setVenuesId(e.target.value)} className="h-10 bg-background border-border text-sm">
            <option value="">— select venue —</option>
            {(venues.data ?? [])
              .filter((v) => v.isActive || v.venuesId === venuesId)
              .map((v) => (
                <option key={v.venuesId} value={v.venuesId}>
                  {venueLabel(v)}
                </option>
              ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">Event type</Label>
          <Select value={eventType} onChange={(e) => setEventType(e.target.value)} className="h-10 bg-background border-border text-sm">
            <option value="Open">Open seating (ticket tiers)</option>
            <option value="Table">Table based (floor plan)</option>
            <option value="Both">Both (tiers + tables)</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">Event starts</Label>
          <DateTimePicker value={start} onChange={setStart} timeZone={timeZone} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">Event ends</Label>
          <DateTimePicker value={end} onChange={setEnd} timeZone={timeZone} fallbackDate={start} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-[10px]">Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="min-h-24 bg-background border-border text-sm" />
        </div>
        <div className="md:col-span-2 p-4 rounded-xl border border-border/50 bg-muted/20">
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={feesIncluded}
              onChange={(e) => toggleFeesIncluded(e.target.checked)}
            />
            <span>
              <span className="font-bold text-sm block">Show fees included in price</span>
              <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                On = buyers see one all-in total. Off = price + fee shown separately. The developer fee amount is
                unchanged either way.
              </span>
            </span>
          </label>
          {tenant.data?.achEnabled ? (
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={achEnabled}
                onChange={(e) => toggleAch(e.target.checked)}
              />
              <span>
                <span className="font-bold text-sm block">Offer ACH (bank) payment</span>
                <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                  Buyers may pay by US bank debit at a lower fee.
                </span>
              </span>
            </label>
          ) : null}
        </div>
        {error ? <p className="text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 leading-normal animate-shake md:col-span-2">{error}</p> : null}

        <div className="md:col-span-2 flex justify-end border-t border-border/10 pt-4 mt-2">
          <Button onClick={save} disabled={saving} className="ticketspan-spring-btn h-11 px-8 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20">
            {saving ? 'Saving…' : 'Save details'}
          </Button>
        </div>
      </CardContent>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="text-lg font-bold font-display text-foreground flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" /> Describe Your Event
          </DialogTitle>
          <div className="space-y-4 py-4">
            {aiErrorMsg ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive animate-shake">
                {aiErrorMsg}
              </div>
            ) : null}

            {aiStep === 'prompt' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Describe your event in plain English, and our AI will automatically fill in the title, description, and category.
                </p>
                <div className="relative">
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. I'm hosting a tech meetup for React developers next Friday at the library. We will have free pizza."
                    rows={5}
                    maxLength={aiPromptLimit}
                    className="bg-background border-border text-sm pb-6"
                    disabled={isGenerating}
                  />
                  <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                    {aiPrompt.length} / {aiPromptLimit}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsAiModalOpen(false);
                      resetAiState();
                    }}
                    disabled={isGenerating}
                    className="h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="ticketspan-spring-btn h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Details'}
                  </Button>
                </div>
              </>
            )}

            {aiStep === 'review' && aiResult && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Review and select the details to fill in.</p>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {(['title', 'description', 'category', 'startDate', 'endDate'] as const).map(field => {
                    const val = aiResult[field];
                    if (!val) return null;
                    return (
                      <div key={field} className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1 w-full overflow-hidden">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{field}</p>
                            <p className="text-sm font-semibold text-foreground break-words whitespace-pre-wrap">{formatAiValue(field, val)}</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => handleRegenerateField(field)} disabled={isRegenerating !== null} className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                            {isRegenerating === field ? 'Regenerating...' : 'Regenerate'}
                          </Button>
                          <Button type="button" size="sm" onClick={() => handleFillField(field, val)} disabled={isRegenerating !== null} className="h-8 px-6 text-[10px] font-bold uppercase tracking-wider ticketspan-spring-btn rounded-lg">
                            Fill
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {(!aiResult.title && !aiResult.description && !aiResult.category && !aiResult.startDate && !aiResult.endDate) && (
                    <p className="text-sm font-semibold text-success py-4 text-center">All generated fields have been filled!</p>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
                  <Button type="button" variant="ghost" onClick={() => { setIsAiModalOpen(false); resetAiState(); }} className="h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs">
                    Close
                  </Button>
                  <Button type="button" onClick={handleFillAll} className="ticketspan-spring-btn h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20">
                    Fill All Remaining
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
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
