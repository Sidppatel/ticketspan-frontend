import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/shared/auth/useAuth';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getEvent,
  getEventStats,
  changeEventStatus,
  listEventTableTypes,
  listTicketTypes,
  updateEvent,
} from '@/features/admin/services/eventAdminService';
import { listTableTemplates } from '@/features/admin/services/tableTemplateService';
import { getVenue } from '@/features/admin/services/catalogService';
import { EventCatalogLinks } from '@/features/admin/components/EventCatalogLinks';
import { EventExtraInfoEditor } from '@/features/admin/components/EventExtraInfoEditor';
import { getEventLayout } from '@/features/admin/services/layoutService';
import { PricingManager } from '@/features/admin/components/PricingManager';
import { GroupDiscountsPanel } from '@/features/admin/components/GroupDiscountsPanel';
import { ScheduleTimeline } from '@/features/admin/components/ScheduleTimeline';
import { TicketTypesManager } from '@/features/admin/components/TicketTypesManager';
import { CheckInLogsPanel } from '@/features/admin/components/CheckInLogsPanel';
import { EventMediaManager } from '@/features/admin/components/EventMediaManager';
import { EventSectionNav } from '@/features/admin/components/EventSectionNav';
import { listStaffForEvent } from '@/features/admin/services/staffAdminService';
import { EventTeamPanel } from '@/features/admin/components/EventTeamPanel';
import { EventTableCatalogSection } from '@/features/admin/components/EventTableCatalogSection';
import { isEventManager } from '@/shared/roles';
import { toast } from 'sonner';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, formatEventDate } from '@/shared/lib/format';
import { tzForState } from '@/shared/lib/timezone';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  CalendarCheck2,
  DollarSign,
  LayoutGrid,
  Ticket,
  TicketCheck,
  MapPin,
  Users,
  Eye,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { EventLivePreview } from '@/features/admin/components/EventLivePreview';
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
  const [pricingKey, setPricingKey] = useState(0);

  async function guard(action: () => Promise<unknown>, reload?: () => void) {
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
      });
      toast.success('Table floor plan enabled for event');
      event.reload();
    } catch (caught) {
      toast.error(rpcErrorMessage(caught));
    }
  }

  const timeZone = tzForState(venue.data?.state);
  const startLabel = event.data?.startDate ? formatEventDate(event.data.startDate) : null;

  function handleCopyLink() {
    const url = previewHref();
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success('Public event link copied to clipboard');
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {event.data && voice && completion ? (
        <>
          <VoiceZone
            event={event.data}
            voice={voice}
            completion={completion}
            startLabel={startLabel}
            venueName={venue.data?.name ?? null}
            previewHref={previewHref()}
            onPublish={() => guard(() => changeEventStatus(eventsId, 'Published'), event.reload)}
            onRevert={() => guard(() => changeEventStatus(eventsId, 'Draft'), event.reload)}
            onCopyLink={handleCopyLink}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat icon={DollarSign} label="Net Revenue" value={centsToUSD(stats.data?.revenueCents ?? 0)} accent />
            <Stat icon={TicketCheck} label="Tickets sold" value={stats.data?.ticketsSold ?? 0} />
            <Stat icon={Ticket} label="Checked in" value={stats.data?.checkedIn ?? 0} />
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
            <EventTableCatalogSection
              eventsId={eventsId}
              templateList={templateList}
              typeList={typeList}
              lockedTypeIds={lockedTypeIds}
              templatesReload={templates.reload}
              tableTypesReload={tableTypes.reload}
              statsReload={stats.reload}
              guard={guard}
              pricingKeyInc={() => setPricingKey((k) => k + 1)}
            />
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
          <EventLivePreview event={event.data} previewUrl={previewHref()} />
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
