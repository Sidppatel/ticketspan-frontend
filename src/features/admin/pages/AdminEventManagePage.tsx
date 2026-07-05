import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/shared/auth/useAuth';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getEvent,
  getEventStats,
  changeEventStatus,
  listEventTableTypes,
  createEventTable,
  deleteEventTable,
  listTicketTypes,
} from '@/features/admin/services/eventAdminService';
import { listTableTemplates } from '@/features/admin/services/tableTemplateService';
import { getVenue } from '@/features/admin/services/catalogService';
import { EventCatalogLinks } from '@/features/admin/components/EventCatalogLinks';
import { EventExtraInfoEditor } from '@/features/admin/components/EventExtraInfoEditor';
import { getEventLayout } from '@/features/admin/services/layoutService';
import { tzForState } from '@/shared/lib/timezone';
import type { TableTemplate } from '@/shared/proto/booking';
import { PricingManager } from '@/features/admin/components/PricingManager';
import { ScheduleTimeline } from '@/features/admin/components/ScheduleTimeline';
import { TicketTypesManager } from '@/features/admin/components/TicketTypesManager';
import { CheckInLogsPanel } from '@/features/admin/components/CheckInLogsPanel';
import { FloorPlanPanel } from '@/features/admin/components/FloorPlanPanel';
import { EventMediaManager } from '@/features/admin/components/EventMediaManager';
import { listStaffForEvent } from '@/features/admin/services/staffAdminService';
import { EventTeamPanel } from '@/features/admin/components/EventTeamPanel';
import { isEventManager } from '@/shared/roles';
import { toast } from 'sonner';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, centsToUsdInput, usdToCents, formatEventDate } from '@/shared/lib/format';
import { addCents } from '@/shared/lib/math';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  CalendarCheck2,
  DollarSign,
  LayoutGrid,
  Ticket,
  TicketCheck,
  MapPin,
  Users,
  Eye,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { EventBrandingPreview } from '@/features/admin/components/branding/EventBrandingPreview';
import { VoiceZone, WhatsNext, EditSection, Stat } from '@/features/admin/components/EventManageParts';
import { buildCompletion, buildVoice, buildSuggestions, type SectionId } from '@/features/admin/lib/eventInsights';


export function AdminEventManagePage() {
  const { eventsId = '' } = useParams();
  const { tenantSlug, role } = useAuth();
  const eventLoader = useCallback(() => getEvent(eventsId), [eventsId]);
  const statsLoader = useCallback(() => getEventStats(eventsId), [eventsId]);
  const tableTypesLoader = useCallback(() => listEventTableTypes(eventsId), [eventsId]);
  const staffLoader = useCallback(
    () => (isEventManager(role) ? Promise.resolve([]) : listStaffForEvent(eventsId)),
    [eventsId, role],
  );
  const templatesLoader = useCallback(() => listTableTemplates().then((items) => items.filter((t) => t.isActive)), []);
  const ticketTypesLoader = useCallback(() => listTicketTypes(eventsId), [eventsId]);
  const layoutLoader = useCallback(() => getEventLayout(eventsId), [eventsId]);

  const event = useAsync(eventLoader);
  const venuesId = event.data?.venuesId;
  const venueLoader = useCallback(
    () => (venuesId ? getVenue(venuesId) : Promise.resolve(null)),
    [venuesId],
  );
  const venue = useAsync(venueLoader);
  const timeZone = tzForState(venue.data?.state);
  const stats = useAsync(statsLoader);
  const tableTypes = useAsync(tableTypesLoader);
  const staff = useAsync(staffLoader);
  const templates = useAsync(templatesLoader);
  const ticketTypes = useAsync(ticketTypesLoader);
  const layout = useAsync(layoutLoader);

  const hasTicketTypes = (ticketTypes.data ?? []).length > 0;
  const hasTablesInFloorPlan = (layout.data?.tables ?? []).length > 0;

  const typeList = tableTypes.data ?? [];
  const lockedTypeIds = new Set(
    (layout.data?.tables ?? []).filter((t) => t.status && t.status !== 'Available').map((t) => t.eventTablesId),
  );
  const usedTemplateNames = new Set(typeList.map((t) => t.label));
  const templateList = (templates.data ?? []).filter((t) => !usedTemplateNames.has(t.name));

  const [tableTemplateId, setTableTemplateId] = useState('');
  const [tableLabel, setTableLabel] = useState('');
  const [tableCapacity, setTableCapacity] = useState(8);
  const [tablePriceCents, setTablePriceCents] = useState(0);
  const [tableColor, setTableColor] = useState('');
  const tableIsAllInclusive = true;
  const tablePerAttendeeCents = 0;
  const [tableWidth, setTableWidth] = useState(80);
  const [tableHeight, setTableHeight] = useState(80);

  function selectTemplate(id: string) {
    setTableTemplateId(id);
    const tpl: TableTemplate | undefined = templateList.find((t) => t.tableTemplatesId === id);
    if (tpl) {
      setTableLabel(tpl.name);
      setTableCapacity(tpl.defaultCapacity);
      setTablePriceCents(tpl.defaultPriceCents);
      setTableColor(tpl.defaultColor);
      setTableWidth(tpl.defaultWidth || 80);
      setTableHeight(tpl.defaultHeight || 80);
    }
  }
  const [notice, setNotice] = useState<string | null>(null);
  const [floorKey, setFloorKey] = useState(0);
  const [pricingKey, setPricingKey] = useState(0);

  async function guard(action: () => Promise<void>, reload?: () => void) {
    setNotice(null);
    try {
      await action();
      reload?.();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; hint: string }[] = [
    { id: 'basics', label: 'Basics', icon: MapPin, hint: 'Name, venue, dates & description' },
    ...(event.data?.eventType !== 'Open'
      ? [{ id: 'layout' as SectionId, label: 'Floor Plan', icon: LayoutGrid, hint: 'Tables & seating layout' }]
      : []),
    { id: 'pricing', label: 'Pricing & Tickets', icon: Ticket, hint: 'Tiers, prices & fees' },
    { id: 'timeline', label: 'Timeline & Media', icon: CalendarCheck2, hint: 'Schedule, photos & lineup' },
    { id: 'staff', label: 'Staff & Roster', icon: Users, hint: 'Assignments & check-in logs' },
    { id: 'preview', label: 'Preview', icon: Eye, hint: 'See the branded event page' },
  ];

  const [activeSection, setActiveSection] = useState<SectionId>('basics');

  const insightInput = { hasTicketTypes, hasFloorTables: hasTablesInFloorPlan, staffCount: (staff.data ?? []).length };
  const completion = event.data ? buildCompletion(event.data, insightInput) : null;
  const voice = event.data && completion ? buildVoice(event.data, stats.data, completion) : null;
  const suggestions = event.data && completion ? buildSuggestions(event.data, stats.data, insightInput, completion) : [];

  function openSection(section: SectionId) {
    setActiveSection(section);
    if (typeof document !== 'undefined') {
      document.getElementById('section-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function previewHref(): string | null {
    if (!event.data || !tenantSlug) return null;
    const { protocol, host } = window.location;
    const labels = host.split('.');
    labels[0] = tenantSlug;
    return `${protocol}//${labels.join('.')}/events/${event.data.slug}`;
  }

  function copyShareLink() {
    const href = previewHref();
    if (!href) {
      toast.error('Publish or set a tenant to get a shareable link.');
      return;
    }
    void navigator.clipboard.writeText(href);
    toast.success('Share link copied to clipboard.');
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {event.loading ? (
        <div className="flex items-center gap-2 justify-center py-8">
          <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Loading event data…</p>
        </div>
      ) : null}
      {event.error ? <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 leading-normal animate-shake">{event.error}</p> : null}
      {notice ? <p className="text-xs font-semibold text-warning bg-warning/10 border border-warning/20 rounded-xl p-3 leading-normal">{notice}</p> : null}

      {event.data && voice && completion ? (
        <VoiceZone
          event={event.data}
          voice={voice}
          completion={completion}
          startLabel={Number(event.data.startDate) > 0 ? formatEventDate(event.data.startDate) : null}
          venueName={venue.data?.name ?? null}
          previewHref={previewHref()}
          onPublish={() => guard(() => changeEventStatus(eventsId, 'Published'), event.reload)}
          onRevert={() => guard(() => changeEventStatus(eventsId, 'Draft'), event.reload)}
          onCopyLink={copyShareLink}
        />
      ) : null}

      {suggestions.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => openSection(s.section)}
              className="group flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/5 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/50 hover:shadow-sm"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber/15 text-amber-foreground">
                <Sparkles className="size-4" />
              </span>
              <span className="space-y-1.5">
                <span className="block text-sm font-semibold leading-snug text-foreground">{s.text}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  {s.actionLabel}
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {event.data && stats.data && (event.data.status === 'Published' || stats.data.totalBookings > 0) ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat icon={CalendarCheck2} label="Bookings" value={stats.data.totalBookings} />
          <Stat icon={Ticket} label="Tickets sold" value={stats.data.ticketsSold} />
          <Stat icon={TicketCheck} label="Checked in" value={stats.data.checkedIn} />
          <Stat icon={DollarSign} label="Revenue" value={centsToUSD(stats.data.revenueCents)} accent />
        </div>
      ) : null}

      {event.data && completion ? (
        <div id="section-canvas" className="scroll-mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => {
            const items = completion.items.filter((i) => i.section === section.id);
            const needsAttention = items.some((i) => i.weight === 'critical' && !i.done);
            const allDone = items.length > 0 && items.every((i) => i.done);
            const isActive = section.id === activeSection;
            return (
              <button
                key={section.id}
                onClick={() => openSection(section.id)}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm',
                  isActive ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5',
                    isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  <section.icon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    {section.label}
                    {needsAttention ? (
                      <AlertCircle className="size-3.5 text-amber-foreground" />
                    ) : allDone ? (
                      <CheckCircle2 className="size-3.5 text-success" />
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{section.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {activeSection === 'basics' && event.data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EditSection event={event.data} timeZone={timeZone} onSaved={event.reload} />
          <EventExtraInfoEditor event={event.data} onSaved={event.reload} />
        </div>
      )}

      {activeSection === 'layout' && event.data && event.data.eventType !== 'Open' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/20 px-6 py-4">
              <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
                <LayoutGrid className="h-4.5 w-4.5 text-primary" /> Event Tables
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Admin reuses a catalog table type and overrides values; cannot create new types. */}
              <div className="flex flex-wrap items-end gap-3 p-4 border border-border/50 bg-muted/20 rounded-xl">
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Table Type</Label>
                  <Select
                    className="h-9 w-48 text-xs bg-background"
                    value={tableTemplateId}
                    onChange={(e) => selectTemplate(e.target.value)}
                  >
                    <option value="">— select —</option>
                    {templateList.map((t) => (
                      <option key={t.tableTemplatesId} value={t.tableTemplatesId}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Table Name</Label>
                  <Input className="h-9 w-32 text-xs bg-background" value={tableLabel} disabled readOnly />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Color</Label>
                  <span
                    className="flex h-9 w-14 items-center justify-center rounded-md border border-input bg-background"
                    title="Inherited from the catalog table type"
                  >
                    <span className="size-5 rounded-sm" style={{ backgroundColor: tableColor || 'transparent' }} />
                  </span>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Capacity</Label>
                  <Input
                    type="number"
                    className="h-9 w-20 text-xs bg-background"
                    disabled={!tableTemplateId}
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-9 w-28 text-xs bg-background"
                    disabled={!tableTemplateId}
                    value={centsToUsdInput(tablePriceCents)}
                    onChange={(e) => setTablePriceCents(usdToCents(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Width (px)</Label>
                  <Input className="h-9 w-20 text-xs bg-background" type="number" value={tableWidth} disabled readOnly />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Height (px)</Label>
                  <Input className="h-9 w-20 text-xs bg-background" type="number" value={tableHeight} disabled readOnly />
                </div>
                <div className="flex items-center h-9 px-2 text-xs font-semibold text-muted-foreground">
                  <input type="checkbox" className="mr-2" checked={tableIsAllInclusive} disabled readOnly />
                  All-inclusive
                </div>
                <Button
                  size="sm"
                  disabled={!tableTemplateId}
                  className="svyne-spring-btn h-9 px-4 rounded-lg font-bold text-xs"
                  onClick={() =>
                    guard(
                      () =>
                        createEventTable({
                          eventsId,
                          label: tableLabel,
                          capacity: tableCapacity,
                          shape: '',
                          color: tableColor,
                          priceCents: tablePriceCents,
                          feeFormulasId: '',
                          isAllInclusive: tableIsAllInclusive,
                          perAttendeeCents: tablePerAttendeeCents,
                          tableTemplatesId: tableTemplateId,
                          width: tableWidth,
                          height: tableHeight,
                        }).then(() => {
                          setTableTemplateId('');
                          setTableLabel('');
                          setTableColor('');
                          setFloorKey((k) => k + 1);
                          setPricingKey((k) => k + 1);
                        }),
                      tableTypes.reload,
                    )
                  }
                >
                  Add table
                </Button>
              </div>
              <div className="space-y-2">
                {typeList.map((type) => (
                  <div key={type.eventTablesId} className="flex items-center justify-between border border-border/50 bg-card rounded-lg px-4 py-3 shadow-sm">
                    <span className="flex items-center gap-3">
                      <span className="inline-block size-4 rounded shadow-sm border border-black/10" style={{ backgroundColor: type.color }} />
                      <span className="font-bold text-sm">{type.label}</span>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{centsToUSD(type.priceCents)}</span>
                      {type.platformFeeCents > 0 ? (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          + fee {centsToUSD(type.platformFeeCents)} ={' '}
                          <span className="text-foreground">{centsToUSD(addCents(type.priceCents, type.platformFeeCents))}</span>
                        </span>
                      ) : null}
                      {lockedTypeIds.has(type.eventTablesId) ? (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">🔒 In use</span>
                      ) : null}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={lockedTypeIds.has(type.eventTablesId)}
                      title={lockedTypeIds.has(type.eventTablesId) ? 'Has sold or held tables — can’t be removed' : undefined}
                      onClick={() =>
                        guard(
                          () =>
                            deleteEventTable(type.eventTablesId).then(() => {
                              setFloorKey((k) => k + 1);
                              setPricingKey((k) => k + 1);
                            }),
                          tableTypes.reload,
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <FloorPlanPanel
            key={`floor-${floorKey}`}
            eventsId={eventsId}
            onTypesChanged={() => setPricingKey((k) => k + 1)}
            onLayoutSaved={() => {
              tableTypes.reload();
              stats.reload();
            }}
          />
        </div>
      )}

      {activeSection === 'pricing' && event.data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <PricingManager
            key={`pricing-${pricingKey}`}
            eventsId={eventsId}
            eventType={event.data.eventType || 'Open'}
            timeZone={timeZone}
          />
          {event.data.eventType !== 'Table' ? (
            <TicketTypesManager eventsId={eventsId} />
          ) : null}
        </div>
      )}



      {activeSection === 'timeline' && event.data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EventMediaManager eventsId={eventsId} />
          
          <EventCatalogLinks
            eventsId={eventsId}
            performersJson={event.data.performersJson}
            sponsorsJson={event.data.sponsorsJson}
            onChanged={event.reload}
          />
          
          <ScheduleTimeline
            eventsId={eventsId}
            eventStart={event.data.startDate}
            eventEnd={event.data.endDate}
            timeZone={timeZone}
          />
        </div>
      )}

      {activeSection === 'staff' && event.data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {isEventManager(role) ? null : (
            <EventTeamPanel
              eventsId={eventsId}
              startDate={event.data.startDate}
              endDate={event.data.endDate}
              staff={staff.data ?? []}
              loading={staff.loading}
              onChanged={staff.reload}
            />
          )}
          <CheckInLogsPanel eventsId={eventsId} eventTitle={event.data.title} />
        </div>
      )}

      {activeSection === 'preview' && event.data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/20 px-6 py-4">
              <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
                <Eye className="h-4.5 w-4.5 text-primary" /> Branded Event Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <EventBrandingPreview eventName={event.data.title} />
            </CardContent>
          </Card>
        </div>
      )}

      {event.data && completion ? (
        <WhatsNext
          completion={completion}
          published={event.data.status === 'Published'}
          onOpen={openSection}
          onPublish={() => guard(() => changeEventStatus(eventsId, 'Published'), event.reload)}
        />
      ) : null}
    </div>
  );
}
