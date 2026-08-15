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
  updateEvent,
} from '@/features/admin/services/eventAdminService';
import { listTableTemplates, createTableTemplate } from '@/features/admin/services/tableTemplateService';
import { getVenue } from '@/features/admin/services/catalogService';
import { EventCatalogLinks } from '@/features/admin/components/EventCatalogLinks';
import { EventExtraInfoEditor } from '@/features/admin/components/EventExtraInfoEditor';
import { getEventLayout } from '@/features/admin/services/layoutService';
import { PricingManager } from '@/features/admin/components/PricingManager';
import { GroupDiscountsPanel } from '@/features/admin/components/GroupDiscountsPanel';
import { ScheduleTimeline } from '@/features/admin/components/ScheduleTimeline';
import { TicketTypesManager } from '@/features/admin/components/TicketTypesManager';
import { CheckInLogsPanel } from '@/features/admin/components/CheckInLogsPanel';
import { FloorPlanPanel } from '@/features/admin/components/FloorPlanPanel';
import { EventMediaManager } from '@/features/admin/components/EventMediaManager';
import { CreateTableTemplateModal } from '@/features/admin/components/CreateTableTemplateModal';
import { EventSectionNav } from '@/features/admin/components/EventSectionNav';
import { listStaffForEvent } from '@/features/admin/services/staffAdminService';
import { EventTeamPanel } from '@/features/admin/components/EventTeamPanel';
import { isEventManager } from '@/shared/roles';
import { toast } from 'sonner';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, centsToUsdInput, usdToCents, formatEventDate } from '@/shared/lib/format';
import { addCents } from '@/shared/lib/math';
import { tzForState } from '@/shared/lib/timezone';
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
  Plus,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { EventBrandingPreview } from '@/features/admin/components/branding/EventBrandingPreview';
import { VoiceZone, WhatsNext, EditSection, Stat } from '@/features/admin/components/EventManageParts';
import { buildCompletion, buildVoice, type SectionId } from '@/features/admin/lib/eventInsights';

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
  const stats = useAsync(statsLoader);
  const tableTypes = useAsync(tableTypesLoader);
  const staff = useAsync(staffLoader);
  const templates = useAsync(templatesLoader);
  const ticketTypes = useAsync(ticketTypesLoader);
  const layout = useAsync(layoutLoader);

  const [notice, setNotice] = useState<string | null>(null);
  const [floorKey, setFloorKey] = useState(0);
  const [isCreateTableTemplateOpen, setIsCreateTableTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplatePriceUsd, setNewTemplatePriceUsd] = useState('0.00');
  const [newTemplateColor, setNewTemplateColor] = useState('#3b82f6');
  const [newTemplateShape, setNewTemplateShape] = useState<'Round' | 'Rectangle' | 'Square' | 'Cocktail'>('Round');
  const [newTemplateCapacity, setNewTemplateCapacity] = useState(8);
  const [newTemplateWidth, setNewTemplateWidth] = useState(80);
  const [newTemplateHeight, setNewTemplateHeight] = useState(80);
  const [newTemplateAllInclusive, setNewTemplateAllInclusive] = useState(true);
  const [newTemplateError, setNewTemplateError] = useState<string | null>(null);
  const [newTemplateSubmitting, setNewTemplateSubmitting] = useState(false);

  const [tableColor, setTableColor] = useState('');
  const [tableWidth, setTableWidth] = useState(80);
  const [tableHeight, setTableHeight] = useState(80);
  const [tableIsAllInclusive, setTableIsAllInclusive] = useState(true);
  const [tablePerAttendeeCents, setTablePerAttendeeCents] = useState(0);

  function selectTemplate(templateId: string) {
    setTableTemplateId(templateId);
    if (!templateId) {
      setTableLabel('');
      setTableCapacity(8);
      setTablePriceCents(0);
      setTableColor('');
      setTableWidth(80);
      setTableHeight(80);
      setTableIsAllInclusive(true);
      setTablePerAttendeeCents(0);
      return;
    }
    const match = (templates.data ?? []).find((t) => t.tableTemplatesId === templateId);
    if (match) {
      setTableLabel(match.name);
      setTableCapacity(match.defaultCapacity);
      setTablePriceCents(match.defaultPriceCents);
      setTableColor(match.defaultColor);
      setTableWidth(match.defaultWidth > 0 ? match.defaultWidth : 80);
      setTableHeight(match.defaultHeight > 0 ? match.defaultHeight : 80);
      setTableIsAllInclusive(match.defaultIsAllInclusive);
    }
  }

  async function handleCreateTableTemplate() {
    if (!newTemplateName.trim()) {
      setNewTemplateError('Template name is required');
      return;
    }
    setNewTemplateSubmitting(true);
    setNewTemplateError(null);
    try {
      const templateId = await createTableTemplate({
        name: newTemplateName.trim(),
        defaultColor: newTemplateColor,
        defaultCapacity: newTemplateCapacity,
        defaultPriceCents: usdToCents(newTemplatePriceUsd),
        defaultWidth: newTemplateWidth,
        defaultHeight: newTemplateHeight,
        defaultShape: newTemplateShape,
        defaultIsAllInclusive: newTemplateAllInclusive,
      });
      await templates.reload();

      setTableTemplateId(templateId);
      setTableLabel(newTemplateName);
      setTableCapacity(newTemplateCapacity);
      setTablePriceCents(usdToCents(newTemplatePriceUsd));
      setTableColor(newTemplateColor);
      setTableWidth(newTemplateWidth);
      setTableHeight(newTemplateHeight);

      setIsCreateTableTemplateOpen(false);
      setNewTemplateName('');
      setNewTemplatePriceUsd('0.00');
      setNewTemplateColor('#3b82f6');
      setNewTemplateShape('Round');
      setNewTemplateCapacity(8);
      setNewTemplateWidth(80);
      setNewTemplateHeight(80);
      setNewTemplateAllInclusive(true);
    } catch (caught) {
      setNewTemplateError(rpcErrorMessage(caught));
    } finally {
      setNewTemplateSubmitting(false);
    }
  }
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

  const hasTicketTypes = (ticketTypes.data ?? []).length > 0;
  const hasTablesInFloorPlan = (layout.data?.tables ?? []).length > 0;

  const typeList = tableTypes.data ?? [];
  const lockedTypeIds = new Set(
    (layout.data?.tables ?? []).filter((t) => t.status && t.status !== 'Available').map((t) => t.eventTablesId),
  );
  const usedTemplateNames = new Set(typeList.map((t: { label: string }) => t.label));
  const templateList = (templates.data ?? []).filter((t) => !usedTemplateNames.has(t.name));

  const [tableTemplateId, setTableTemplateId] = useState('');
  const [tableLabel, setTableLabel] = useState('');
  const [tableCapacity, setTableCapacity] = useState(8);
  const [tablePriceCents, setTablePriceCents] = useState(0);

  const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; hint: string }[] = [
    { id: 'basics', label: 'Basics', icon: MapPin, hint: 'Name, venue, dates & story' },
    { id: 'layout', label: 'Floor Plan', icon: LayoutGrid, hint: 'Tables & seating layout' },
    { id: 'pricing', label: 'Pricing & Tickets', icon: Ticket, hint: 'Tiers, prices & fees' },
    { id: 'timeline', label: 'Timeline & Media', icon: CalendarCheck2, hint: 'Schedule, photos & lineup' },
    { id: 'staff', label: 'Staff & Roster', icon: Users, hint: 'Assignments & check-in logs' },
    { id: 'preview', label: 'Preview', icon: Eye, hint: 'See the branded event page' },
  ];

  const [activeSection, setActiveSection] = useState<SectionId>('basics');

  const insightInput = { hasTicketTypes, hasFloorTables: hasTablesInFloorPlan, staffCount: (staff.data ?? []).length };
  const completion = event.data ? buildCompletion(event.data, insightInput) : null;
  const voice = event.data && completion ? buildVoice(event.data, stats.data, completion) : null;

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

  async function enableTableSeating() {
    if (!event.data) return;
    try {
      await updateEvent(event.data.eventsId, {
        title: event.data.title,
        slug: event.data.slug,
        description: event.data.description,
        status: event.data.status,
        category: event.data.category,
        startDate: event.data.startDate,
        endDate: event.data.endDate,
        layoutMode: 'Grid',
        eventType: 'Both',
        venuesId: event.data.venuesId,
        imagePath: event.data.imagePath,
        shortDescription: event.data.shortDescription,
        storyDescription: event.data.storyDescription,
        urgencyBadgeText: event.data.urgencyBadgeText,
        isVerifiedOrganizer: event.data.isVerifiedOrganizer,
        heroBackdropImageId: event.data.heroBackdropImageId,
        posterImageId: event.data.posterImageId,
      });
      toast.success('Switched event to table seating floor plan mode');
      await event.reload();
    } catch (caught) {
      toast.error(rpcErrorMessage(caught));
    }
  }

  const timeZone = tzForState(venue.data?.state);
  const dateFormatted = event.data ? formatEventDate(event.data.startDate) : null;

  return (
    <div className="space-y-6 pb-20">
      {event.loading ? (
        <div className="space-y-4 py-8">
          <div className="h-10 w-48 rounded-xl bg-muted/40 animate-pulse" />
          <div className="h-32 w-full rounded-2xl bg-muted/30 animate-pulse" />
        </div>
      ) : event.error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          <p className="font-bold">Error loading event</p>
          <p className="text-xs">{rpcErrorMessage(event.error)}</p>
        </div>
      ) : event.data && voice && completion ? (
        <>
          <VoiceZone
            event={event.data}
            voice={voice}
            completion={completion}
            startLabel={dateFormatted}
            venueName={venue.data?.name ?? null}
            previewHref={previewHref()}
            onPublish={() => guard(() => changeEventStatus(eventsId, 'Published'), event.reload)}
            onRevert={() => guard(() => changeEventStatus(eventsId, 'Draft'), event.reload)}
            onCopyLink={() => {
              const href = previewHref();
              if (href) {
                navigator.clipboard.writeText(href);
                toast.success('Public URL copied to clipboard');
              }
            }}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat icon={TicketCheck} label="Tickets sold" value={stats.data?.ticketsSold ?? 0} accent />
            <Stat icon={DollarSign} label="Revenue" value={centsToUSD(stats.data?.revenueCents ?? 0)} />
            <Stat icon={Users} label="Check-ins" value={stats.data?.checkedIn ?? 0} />
            <Stat icon={CalendarCheck2} label="Total bookings" value={stats.data?.totalBookings ?? 0} />
          </div>

          <EventSectionNav
            sections={SECTIONS}
            completion={completion}
            activeSection={activeSection}
            openSection={openSection}
          />
        </>
      ) : null}

      {notice ? (
        <div className="rounded-xl border border-amber/30 bg-amber/10 p-4 text-xs font-semibold text-amber-foreground flex items-center justify-between">
          <span>{notice}</span>
          <Button size="sm" variant="ghost" onClick={() => setNotice(null)} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      ) : null}

      {activeSection === 'basics' && event.data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EditSection event={event.data} timeZone={timeZone} onSaved={event.reload} />
          <EventExtraInfoEditor event={event.data} onSaved={event.reload} />
        </div>
      )}

      {activeSection === 'layout' && event.data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {event.data.eventType === 'Open' ? (
            <Card className="border border-primary/20 bg-primary/5 shadow-sm rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Info className="size-4 text-primary" /> Floor Plan is currently disabled for Open Seating
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This event is currently set to Open seating (ticket tiers only). To unlock the interactive table & seating map builder, switch event type to "Both" or "Table based".
                  </p>
                </div>
                <Button onClick={enableTableSeating} className="ticketspan-spring-btn h-10 px-5 rounded-xl font-bold text-xs shrink-0">
                  Enable Table Floor Plan
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border/20 px-6 py-4">
                  <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
                    <LayoutGrid className="h-4.5 w-4.5 text-primary" /> Table Catalog & Seating Specs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-wrap items-end gap-3 p-4 border border-border/50 bg-muted/20 rounded-xl">
                    <div className="space-y-1.5 flex flex-col">
                      <div className="flex items-center justify-between gap-2 min-w-[12rem]">
                        <Label className="text-[10px]">Table Type</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsCreateTableTemplateOpen(true)}
                          className="h-auto p-0 text-[10px] font-bold text-primary flex items-center gap-0.5 hover:bg-transparent hover:text-primary"
                        >
                          <Plus className="h-3 w-3" /> Create New
                        </Button>
                      </div>
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
                        title="Inherited from catalog table type"
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
                      className="ticketspan-spring-btn h-9 px-4 rounded-lg font-bold text-xs"
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
                    {typeList.map((type: { eventTablesId: string; label: string; priceCents: number; platformFeeCents: number; color: string }) => (
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
            </>
          )}
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
            <>
              <TicketTypesManager eventsId={eventsId} />
              <GroupDiscountsPanel eventsId={eventsId} />
            </>
          ) : null}
        </div>
      )}

      {activeSection === 'timeline' && event.data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EventMediaManager event={event.data} onSaved={event.reload} />

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

      <CreateTableTemplateModal
        isOpen={isCreateTableTemplateOpen}
        onOpenChange={setIsCreateTableTemplateOpen}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        newTemplateColor={newTemplateColor}
        setNewTemplateColor={setNewTemplateColor}
        newTemplateShape={newTemplateShape}
        setNewTemplateShape={(v) => setNewTemplateShape(v as 'Round' | 'Square' | 'Rectangle' | 'Cocktail')}
        newTemplateCapacity={newTemplateCapacity}
        setNewTemplateCapacity={setNewTemplateCapacity}
        newTemplatePriceUsd={newTemplatePriceUsd}
        setNewTemplatePriceUsd={setNewTemplatePriceUsd}
        newTemplateWidth={newTemplateWidth}
        setNewTemplateWidth={setNewTemplateWidth}
        newTemplateHeight={newTemplateHeight}
        setNewTemplateHeight={setNewTemplateHeight}
        newTemplateAllInclusive={newTemplateAllInclusive}
        setNewTemplateAllInclusive={setNewTemplateAllInclusive}
        newTemplateError={newTemplateError}
        setNewTemplateError={setNewTemplateError}
        newTemplateSubmitting={newTemplateSubmitting}
        handleCreateTableTemplate={handleCreateTableTemplate}
      />
    </div>
  );
}
