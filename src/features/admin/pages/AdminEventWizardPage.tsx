import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, generateEventInfo, getAiSettings, type EventDraft, type GenerateEventInfoResponse } from '@/features/admin/services/eventAdminService';
import { listVenues, createVenue, type VenueDraft } from '@/features/admin/services/catalogService';
import type { Venue } from '@/shared/proto/catalog';
import { listEnums, type EnumOption } from '@/shared/enums';
import { tzForState, zonedInputToEpoch } from '@/shared/lib/timezone';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Separator } from '@/shared/ui/separator';
import { Field, FieldLabel, FieldGroup } from '@/shared/ui/field';
import { CardContent } from '@/shared/ui/card';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { cn } from '@/shared/lib/cn';
import { CalendarCheck2, LayoutGrid, MapPin, Rocket, Ticket, Users, Plus, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { VenueFields, venueError, normalizeVenue, emptyDraft } from '@/features/admin/pages/AdminVenuesPage';


const CATEGORIES = ['Music', 'Business', 'Social', 'Dining', 'Tech', 'Arts', 'Family', 'Sports'];

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

export function AdminEventWizardPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Music');
  const [eventTypes, setEventTypes] = useState<EnumOption[]>([]);
  const [eventType, setEventType] = useState('Open');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesId, setVenuesId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateVenueOpen, setIsCreateVenueOpen] = useState(false);
  const [venueDraft, setVenueDraft] = useState<VenueDraft>(emptyDraft());
  const [venueErrorMsg, setVenueErrorMsg] = useState<string | null>(null);
  const [venueSubmitting, setVenueSubmitting] = useState(false);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiErrorMsg, setAiErrorMsg] = useState<string | null>(null);
  const [aiPromptLimit, setAiPromptLimit] = useState(200);

  const [aiStep, setAiStep] = useState<'prompt' | 'review'>('prompt');
  const [aiResult, setAiResult] = useState<GenerateEventInfoResponse | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

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

  async function handleCreateVenue() {
    const err = venueError(venueDraft);
    if (err) {
      setVenueErrorMsg(err);
      return;
    }
    setVenueErrorMsg(null);
    setVenueSubmitting(true);
    try {
      const newVenueId = await createVenue(normalizeVenue(venueDraft));
      const updatedVenues = await listVenues();
      setVenues(updatedVenues);
      setVenuesId(newVenueId);
      setVenueDraft(emptyDraft());
      setIsCreateVenueOpen(false);
    } catch (caught) {
      setVenueErrorMsg(rpcErrorMessage(caught));
    } finally {
      setVenueSubmitting(false);
    }
  }

  const venueTz = tzForState(venues.find((v) => v.venuesId === venuesId)?.state);

  const STEPS = [
    { id: 'basics', label: 'Basics', icon: MapPin },
    ...(eventType !== 'Open' ? [{ id: 'layout', label: 'Floor Plan', icon: LayoutGrid }] : []),
    { id: 'pricing', label: 'Pricing & Tickets', icon: Ticket },
    { id: 'timeline', label: 'Timeline & Media', icon: CalendarCheck2 },
    { id: 'staff', label: 'Staff & Roster', icon: Users },
    { id: 'publish', label: 'Review & Publish', icon: Rocket },
  ];


  useEffect(() => {
    getAiSettings()
      .then((settings) => setAiPromptLimit(settings.promptMaxLength))
      .catch((caught) => console.error('Failed to load AI settings', caught));

    listVenues()
      .then((loaded) => {
        setVenues(loaded);
        if (loaded.length > 0) {
          setVenuesId((current) => current || loaded[0].venuesId);
        }
      })
      .catch((caught) => setError(rpcErrorMessage(caught)));

    listEnums('EventType')
      .then((loaded) => {
        setEventTypes(loaded);
        if (loaded.length > 0) {
          setEventType(loaded[0].value);
        }
      })
      .catch((caught) => setError(rpcErrorMessage(caught)));
  }, []);

  async function submit() {
    if (!venuesId) {
      setError('Select a venue first');
      return;
    }
    setSubmitting(true);
    setError(null);
    const draft: EventDraft = {
      title,
      slug: '',
      description,
      status: 'Draft',
      category,
      startDate: zonedInputToEpoch(start, venueTz),
      endDate: zonedInputToEpoch(end, venueTz),
      
      layoutMode: eventType === 'Open' ? 'Open' : 'Grid',
      eventType,
      venuesId,
      imagePath: '',
    };
    try {
      const eventsId = await createEvent(draft);
      navigate(`/events/${eventsId}`);
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight font-display text-foreground md:text-3xl">New Event</h1>
        <p className="text-xs text-muted-foreground">Follow the steps to configure a new event.</p>
      </div>

      {}
      <div className="flex items-center justify-between overflow-x-auto pb-2 border-b border-border/20">
        {STEPS.map((step, index) => {
          const isActive = index === 0;

          return (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground opacity-60"
              )}>
                <step.icon className="h-4.5 w-4.5" />
                <span>{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className="w-8 h-px bg-border/40 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      <div className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8">
          <FieldGroup>
            <div className="flex items-center justify-between">
              <SectionLabel>Details</SectionLabel>
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
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="title" className="text-[10px]">Title</FieldLabel>
                <div className="ticketspan-spring-input">
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summer Gala 2026"
                    className="h-10 bg-background border-border text-sm"
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="category" className="text-[10px]">Category</FieldLabel>
                <div className="ticketspan-spring-input">
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    list="wizard-category-suggestions"
                    placeholder="e.g. Music"
                    className="h-10 bg-background border-border text-sm"
                  />
                  <datalist id="wizard-category-suggestions">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="eventType" className="text-[10px]">Event type</FieldLabel>
                <Select
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="h-10 bg-background border-border text-sm"
                >
                  {eventTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value === 'Open'
                        ? 'Open seating (ticket tiers)'
                        : option.value === 'Table'
                          ? 'Table based (floor plan)'
                          : 'Both (tiers + tables)'}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="description" className="text-[10px]">Description</FieldLabel>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell guests what to expect…"
                  rows={4}
                  className="bg-background border-border text-sm"
                />
              </Field>
            </div>

            <Separator />

            <SectionLabel>Venue &amp; schedule</SectionLabel>
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
              <Field className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="venue" className="text-[10px]">Venue</FieldLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateVenueOpen(true)}
                    className="h-auto px-2 py-1 text-xs font-bold text-primary flex items-center gap-1 hover:bg-primary/5 hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create New Venue
                  </Button>
                </div>
                <Select id="venue" value={venuesId} onChange={(e) => setVenuesId(e.target.value)} className="h-10 bg-background border-border text-sm">
                  {venues.length === 0 ? (
                    <option value="">No venues — create one first</option>
                  ) : null}
                  {venues.map((venue) => (
                    <option key={venue.venuesId} value={venue.venuesId}>
                      {venue.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Start</FieldLabel>
                <DateTimePicker value={start} onChange={setStart} timeZone={venueTz} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">End</FieldLabel>
                <DateTimePicker value={end} onChange={setEnd} timeZone={venueTz} fallbackDate={start} />
              </Field>
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive animate-shake">
                {error}
              </div>
            ) : null}

            <Separator className="bg-border/20" />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => navigate(-1)} disabled={submitting} className="h-11 px-8 rounded-xl font-bold uppercase tracking-wider text-xs">
                Cancel
              </Button>
              <Button onClick={submit} disabled={submitting} className="ticketspan-spring-btn h-11 px-8 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20">
                {submitting ? 'Creating…' : 'Next Step →'}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </div>

      <Dialog open={isCreateVenueOpen} onOpenChange={setIsCreateVenueOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-lg font-bold font-display text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Create New Venue
          </DialogTitle>
          <div className="space-y-4 py-4">
            {venueErrorMsg ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive animate-shake">
                {venueErrorMsg}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Name</label>
              <div className="ticketspan-spring-input">
                <Input
                  value={venueDraft.name}
                  onChange={(e) => setVenueDraft({ ...venueDraft, name: e.target.value })}
                  placeholder="Venue Name"
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>

            <VenueFields draft={venueDraft} onChange={setVenueDraft} />

            <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreateVenueOpen(false);
                  setVenueDraft(emptyDraft());
                  setVenueErrorMsg(null);
                }}
                disabled={venueSubmitting}
                className="h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateVenue}
                disabled={venueSubmitting || !venueDraft.name.trim()}
                className="ticketspan-spring-btn h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20"
              >
                {venueSubmitting ? 'Creating...' : 'Create Venue'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</p>
  );
}
