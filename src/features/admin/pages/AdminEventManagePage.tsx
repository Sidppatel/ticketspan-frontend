import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getEvent,
  getEventStats,
  changeEventStatus,
  updateEvent,
  listEventTableTypes,
  createEventTable,
  deleteEventTable,
  setEventFeesIncluded,
} from '@/features/admin/services/eventAdminService';
import { listTableTemplates } from '@/features/admin/services/tableTemplateService';
import { getVenue } from '@/features/admin/services/catalogService';
import { tzForState, epochToZonedInput, zonedInputToEpoch, zoneAbbrev } from '@/shared/lib/timezone';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import type { TableTemplate } from '@/shared/proto/booking';
import { PricingManager } from '@/features/admin/components/PricingManager';
import { ScheduleTimeline } from '@/features/admin/components/ScheduleTimeline';
import { TicketTypesManager } from '@/features/admin/components/TicketTypesManager';
import { FloorPlanPanel } from '@/features/admin/components/FloorPlanPanel';
import { EventMediaManager } from '@/features/admin/components/EventMediaManager';
import type { Event } from '@/shared/proto/event';
import {
  listStaffForEvent,
  assignStaff,
  unassignStaff,
} from '@/features/admin/services/staffAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  CalendarCheck2,
  DollarSign,
  FileEdit,
  LayoutGrid,
  Rocket,
  Ticket,
  TicketCheck,
  Undo2,
  UserCog,
  type LucideIcon,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  Published: 'bg-success/15 text-success ring-success/30',
  Draft: 'bg-amber/15 text-amber-foreground ring-amber/30',
  Cancelled: 'bg-destructive/15 text-destructive ring-destructive/30',
};

function StatusPill({ status }: { status: string }) {
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

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <CardHeader className="flex flex-row items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
        <Icon />
      </span>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
  );
}

export function AdminEventManagePage() {
  const { eventsId = '' } = useParams();
  const eventLoader = useCallback(() => getEvent(eventsId), [eventsId]);
  const statsLoader = useCallback(() => getEventStats(eventsId), [eventsId]);
  const tableTypesLoader = useCallback(() => listEventTableTypes(eventsId), [eventsId]);
  const staffLoader = useCallback(() => listStaffForEvent(eventsId), [eventsId]);
  const templatesLoader = useCallback(() => listTableTemplates(), []);

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

  const typeList = tableTypes.data ?? [];
  const usedTemplateNames = new Set(typeList.map((t) => t.label));
  const templateList = (templates.data ?? []).filter((t) => !usedTemplateNames.has(t.name));

  // Admin picks a catalog table type; values below override the template defaults.
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
  const [assignUserId, setAssignUserId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  // Bumped when a table type is added so the floor-plan palette reloads.
  const [floorKey, setFloorKey] = useState(0);
  // Bumped when table types change so the Pricing panel reloads (each type owns a price).
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

  return (
    <div className="space-y-6">
      {event.loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {event.error ? <p className="text-destructive">{event.error}</p> : null}
      {notice ? <p className="text-sm text-amber-foreground">{notice}</p> : null}

      {event.data ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-br from-primary/10 via-card to-amber/5 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <StatusPill status={event.data.status} />
                <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                  {event.data.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {event.data.eventType || 'Open'} event · {event.data.category || 'Uncategorised'}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={() => guard(() => changeEventStatus(eventsId, 'Published'), event.reload)}>
                  <Rocket /> Publish
                </Button>
                <Button size="sm" variant="outline" onClick={() => guard(() => changeEventStatus(eventsId, 'Draft'), event.reload)}>
                  <Undo2 /> Set draft
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {stats.data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={CalendarCheck2} label="Bookings" value={stats.data.totalBookings} />
          <Stat icon={Ticket} label="Tickets sold" value={stats.data.ticketsSold} />
          <Stat icon={TicketCheck} label="Checked in" value={stats.data.checkedIn} />
          <Stat icon={DollarSign} label="Revenue" value={centsToUSD(stats.data.revenueCents)} accent />
        </div>
      ) : null}

      {event.data ? <EditSection event={event.data} timeZone={timeZone} onSaved={event.reload} /> : null}

      <EventMediaManager eventsId={eventsId} />

      {event.data ? (
        <ScheduleTimeline
          eventsId={eventsId}
          eventStart={event.data.startDate}
          eventEnd={event.data.endDate}
          timeZone={timeZone}
        />
      ) : null}

      <PricingManager
        key={`pricing-${pricingKey}`}
        eventsId={eventsId}
        eventType={event.data?.eventType || 'Open'}
        timeZone={timeZone}
      />
      {event.data && event.data.eventType !== 'Table' ? (
        <TicketTypesManager eventsId={eventsId} />
      ) : null}

      {event.data && event.data.eventType !== 'Open' ? (
      <Card>
        <SectionHeader icon={LayoutGrid} title="Tables" />
        <CardContent className="space-y-3">
          {/* Admin reuses a catalog table type and overrides values; cannot create new types. */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Table type (catalog)</Label>
              <Select
                className="w-48"
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
            <div className="space-y-1">
              <Label>Table type name</Label>
              <Input className="w-32" value={tableLabel} disabled readOnly />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <span
                className="flex h-9 w-14 items-center justify-center rounded-md border border-input"
                title="Inherited from the catalog table type"
              >
                <span className="size-5 rounded-sm" style={{ backgroundColor: tableColor || 'transparent' }} />
              </span>
            </div>
            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input
                type="number"
                disabled={!tableTemplateId}
                value={tableCapacity}
                onChange={(e) => setTableCapacity(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>Price (cents)</Label>
              <Input
                type="number"
                disabled={!tableTemplateId}
                value={tablePriceCents}
                onChange={(e) => setTablePriceCents(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>Width (px)</Label>
              <Input className="w-20" type="number" value={tableWidth} disabled readOnly />
            </div>
            <div className="space-y-1">
              <Label>Height (px)</Label>
              <Input className="w-20" type="number" value={tableHeight} disabled readOnly />
            </div>
            <label className="flex items-center gap-2 self-center text-sm">
              <input type="checkbox" checked={tableIsAllInclusive} disabled readOnly />
              All-inclusive (flat table price)
            </label>
            <Button
              size="sm"
              disabled={!tableTemplateId}
              onClick={() =>
                guard(
                  () =>
                    createEventTable({
                      eventsId,
                      label: tableLabel,
                      capacity: tableCapacity,
                      // Empty = inherit the catalog template's default shape.
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
          <div className="space-y-1">
            {typeList.map((type) => (
              <div key={type.eventTablesId} className="flex items-center justify-between border-b py-1 text-sm">
                <span className="flex items-center gap-2">
                  <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: type.color }} />
                  {type.label} · {centsToUSD(type.priceCents)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
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
      ) : null}

      {event.data && event.data.eventType !== 'Open' ? (
        <FloorPlanPanel
          key={`floor-${floorKey}`}
          eventsId={eventsId}
          onTypesChanged={() => setPricingKey((k) => k + 1)}
          onLayoutSaved={() => {
            tableTypes.reload();
            stats.reload();
          }}
        />
      ) : null}

      <Card>
        <SectionHeader icon={UserCog} title="Staff" />
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>User ID</Label>
              <Input value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} />
            </div>
            <Button
              size="sm"
              onClick={() => guard(() => assignStaff(assignUserId, eventsId).then(() => setAssignUserId('')), staff.reload)}
            >
              Assign staff
            </Button>
          </div>
          <div className="space-y-1">
            {(staff.data ?? []).map((member) => (
              <div key={member.usersId} className="flex items-center justify-between border-b py-1 text-sm">
                <span>
                  {member.firstName} {member.lastName} · {member.email}
                </span>
                <Button size="sm" variant="ghost" onClick={() => guard(() => unassignStaff(member.usersId, eventsId), staff.reload)}>
                  Unassign
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EditSection({
  event,
  timeZone,
  onSaved,
}: {
  event: Event;
  timeZone: string;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [category, setCategory] = useState(event.category);
  const [eventType, setEventType] = useState(event.eventType || 'Open');
  const [feesIncluded, setFeesIncluded] = useState(event.feesIncluded);
  const [start, setStart] = useState(epochToZonedInput(event.startDate, timeZone));
  const [end, setEnd] = useState(epochToZonedInput(event.endDate, timeZone));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleFeesIncluded(next: boolean) {
    setFeesIncluded(next);
    try {
      await setEventFeesIncluded(event.eventsId, next);
    } catch (caught) {
      setFeesIncluded(!next);
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
        // Open has no floor plan; Table/Both need the grid layout.
        layoutMode: eventType === 'Open' ? 'Open' : 'Grid',
        eventType,
        venuesId: event.venuesId,
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
    <Card>
      <SectionHeader icon={FileEdit} title="Edit details" />
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Event capacity</Label>
          <Input type="number" value={event.totalCapacity} readOnly disabled />
        </div>
        <div className="space-y-1">
          <Label>Event type</Label>
          <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            <option value="Open">Open seating (ticket tiers)</option>
            <option value="Table">Table based (floor plan)</option>
            <option value="Both">Both (tiers + tables)</option>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <Label>Event starts</Label>
            <span className="text-xs text-muted-foreground">Times in {zoneAbbrev(timeZone)}</span>
          </div>
          <DateTimePicker value={start} onChange={setStart} timeZone={timeZone} />
        </div>
        <div className="space-y-1">
          <Label>Event ends</Label>
          <DateTimePicker value={end} onChange={setEnd} timeZone={timeZone} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={feesIncluded}
              onChange={(e) => toggleFeesIncluded(e.target.checked)}
            />
            <span>
              <span className="font-medium">Show fees included in price</span>
              <span className="block text-muted-foreground">
                On = buyers see one all-in total. Off = price + fee shown separately. The developer fee amount is
                unchanged either way.
              </span>
            </span>
          </label>
        </div>
        {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
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
    <Card className={cn('relative overflow-hidden', accent && 'border-amber/40')}>
      <CardContent className="space-y-1">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-md [&_svg]:size-4',
            accent ? 'bg-amber/15 text-amber-foreground' : 'bg-primary/10 text-primary',
          )}
        >
          <Icon />
        </span>
        <p className="pt-1 font-display text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
