import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getEvent,
  getEventStats,
  changeEventStatus,
  updateEvent,
  createTicketType,
  listTicketTypes,
  listEventTables,
  createEventTable,
  deleteEventTable,
  setEventFeesIncluded,
} from '@/features/admin/services/eventAdminService';
import { listTableTemplates } from '@/features/admin/services/tableTemplateService';
import type { TableTemplate } from '@/shared/proto/booking';
import { PricingManager } from '@/features/admin/components/PricingManager';
import { FloorPlanPanel } from '@/features/admin/components/FloorPlanPanel';
import { ImageUpload } from '@/shared/components/ImageUpload';
import type { Event } from '@/shared/proto/event';
import {
  listStaffForEvent,
  assignStaff,
  unassignStaff,
} from '@/features/admin/services/staffAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { addCents } from '@/shared/lib/math';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function AdminEventManagePage() {
  const { eventsId = '' } = useParams();
  const eventLoader = useCallback(() => getEvent(eventsId), [eventsId]);
  const statsLoader = useCallback(() => getEventStats(eventsId), [eventsId]);
  const tablesLoader = useCallback(() => listEventTables(eventsId), [eventsId]);
  const ticketTypesLoader = useCallback(() => listTicketTypes(eventsId), [eventsId]);
  const staffLoader = useCallback(() => listStaffForEvent(eventsId), [eventsId]);
  const templatesLoader = useCallback(() => listTableTemplates(), []);

  const event = useAsync(eventLoader);
  const stats = useAsync(statsLoader);
  const tables = useAsync(tablesLoader);
  const ticketTypes = useAsync(ticketTypesLoader);
  const staff = useAsync(staffLoader);
  const templates = useAsync(templatesLoader);

  const templateList = templates.data ?? [];

  const [ticketLabel, setTicketLabel] = useState('');
  const [ticketPriceCents, setTicketPriceCents] = useState(0);
  // Admin picks a catalog table type; values below override the template defaults.
  const [tableTemplateId, setTableTemplateId] = useState('');
  const [tableLabel, setTableLabel] = useState('');
  const [tableCapacity, setTableCapacity] = useState(8);
  const [tablePriceCents, setTablePriceCents] = useState(0);
  const [tableIsAllInclusive, setTableIsAllInclusive] = useState(true);
  const [tablePerAttendeeCents, setTablePerAttendeeCents] = useState(0);
  const [tableRowSpan, setTableRowSpan] = useState(1);
  const [tableColSpan, setTableColSpan] = useState(1);

  function selectTemplate(id: string) {
    setTableTemplateId(id);
    const tpl: TableTemplate | undefined = templateList.find((t) => t.tableTemplatesId === id);
    if (tpl) {
      setTableLabel(tpl.name);
      setTableCapacity(tpl.defaultCapacity);
      setTablePriceCents(tpl.defaultPriceCents);
      setTableRowSpan(tpl.defaultRowSpan || 1);
      setTableColSpan(tpl.defaultColSpan || 1);
    }
  }
  const [assignUserId, setAssignUserId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

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
      {event.loading ? <p className="text-gray-500">Loading…</p> : null}
      {event.error ? <p className="text-red-600">{event.error}</p> : null}
      {notice ? <p className="text-sm text-amber-700">{notice}</p> : null}

      {event.data ? (
        <Card>
          <CardHeader>
            <CardTitle>{event.data.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500">Status: {event.data.status}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => guard(() => changeEventStatus(eventsId, 'Published'), event.reload)}>
                Publish
              </Button>
              <Button size="sm" variant="outline" onClick={() => guard(() => changeEventStatus(eventsId, 'Draft'), event.reload)}>
                Set draft
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {event.data ? <EditSection event={event.data} onSaved={event.reload} /> : null}

      <PricingManager eventsId={eventsId} />
      {event.data && event.data.eventType !== 'Open' ? <FloorPlanPanel eventsId={eventsId} /> : null}

      {stats.data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Bookings" value={stats.data.totalBookings} />
          <Stat label="Tickets sold" value={stats.data.ticketsSold} />
          <Stat label="Checked in" value={stats.data.checkedIn} />
          <Stat label="Revenue" value={centsToUSD(stats.data.revenueCents)} />
        </div>
      ) : null}

      {event.data && event.data.eventType !== 'Table' ? (
      <Card>
        <CardHeader>
          <CardTitle>Ticket types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={ticketLabel} onChange={(e) => setTicketLabel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Price (cents)</Label>
              <Input type="number" value={ticketPriceCents} onChange={(e) => setTicketPriceCents(Number(e.target.value))} />
            </div>
            {/* Service fee is developer-controlled (tenant default formula); not set here. */}
            <Button
              size="sm"
              onClick={() =>
                guard(() =>
                  createTicketType({
                    eventsId,
                    label: ticketLabel,
                    priceCents: ticketPriceCents,
                    feeFormulasId: '',
                    maxQuantity: 0,
                    sortOrder: 0,
                    description: '',
                  }).then(() => {
                    setTicketLabel('');
                    ticketTypes.reload();
                  }),
                )
              }
            >
              Add ticket type
            </Button>
          </div>

          <div className="space-y-1">
            {(ticketTypes.data ?? []).map((tt) => (
              <div key={tt.eventTicketTypesId} className="flex items-center justify-between border-b py-1 text-sm">
                <span>{tt.label}</span>
                <span className="text-gray-600">
                  {centsToUSD(tt.priceCents)} + fee {centsToUSD(tt.platformFeeCents)} = {centsToUSD(addCents(tt.priceCents, tt.platformFeeCents))}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      ) : null}

      {event.data && event.data.eventType !== 'Open' ? (
      <Card>
        <CardHeader>
          <CardTitle>Tables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Admin reuses a catalog table type and overrides values; cannot create new types. */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Table type (catalog)</Label>
              <select
                className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                value={tableTemplateId}
                onChange={(e) => selectTemplate(e.target.value)}
              >
                <option value="">— select —</option>
                {templateList.map((t) => (
                  <option key={t.tableTemplatesId} value={t.tableTemplatesId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={tableLabel} onChange={(e) => setTableLabel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input type="number" value={tableCapacity} onChange={(e) => setTableCapacity(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Price (cents)</Label>
              <Input type="number" value={tablePriceCents} onChange={(e) => setTablePriceCents(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Row span</Label>
              <Input className="w-20" type="number" min={1} value={tableRowSpan} onChange={(e) => setTableRowSpan(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Col span</Label>
              <Input className="w-20" type="number" min={1} value={tableColSpan} onChange={(e) => setTableColSpan(Number(e.target.value))} />
            </div>
            <label className="flex items-center gap-2 self-center text-sm">
              <input
                type="checkbox"
                checked={tableIsAllInclusive}
                onChange={(e) => setTableIsAllInclusive(e.target.checked)}
              />
              All-inclusive (flat table price)
            </label>
            {!tableIsAllInclusive && (
              <div className="space-y-1">
                <Label>Per attendee (cents)</Label>
                <Input
                  type="number"
                  value={tablePerAttendeeCents}
                  onChange={(e) => setTablePerAttendeeCents(Number(e.target.value))}
                />
              </div>
            )}
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
                      shape: 'Round',
                      color: '#888888',
                      priceCents: tablePriceCents,
                      feeFormulasId: '',
                      isAllInclusive: tableIsAllInclusive,
                      perAttendeeCents: tablePerAttendeeCents,
                      tableTemplatesId: tableTemplateId,
                      rowSpan: tableRowSpan,
                      colSpan: tableColSpan,
                    }).then(() => {
                      setTableTemplateId('');
                      setTableLabel('');
                    }),
                  tables.reload,
                )
              }
            >
              Add table
            </Button>
          </div>
          <div className="space-y-1">
            {(tables.data ?? []).map((table) => (
              <div key={table.tablesId} className="flex items-center justify-between border-b py-1 text-sm">
                <span>
                  {table.label} · {table.status}
                </span>
                <Button size="sm" variant="ghost" onClick={() => guard(() => deleteEventTable(table.tablesId), tables.reload)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
        </CardHeader>
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

function EditSection({ event, onSaved }: { event: Event; onSaved: () => void }) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [category, setCategory] = useState(event.category);
  const [capacity, setCapacity] = useState(event.maxCapacity);
  const [eventType, setEventType] = useState(event.eventType || 'Open');
  const [imagePath, setImagePath] = useState(event.imagePath);
  const [feesIncluded, setFeesIncluded] = useState(event.feesIncluded);
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
        startDate: event.startDate,
        endDate: event.endDate,
        maxCapacity: capacity,
        // Open has no floor plan; Table/Both need the grid layout.
        layoutMode: eventType === 'Open' ? 'Open' : 'Grid',
        eventType,
        venuesId: event.venuesId,
        gridRows: 0,
        gridCols: 0,
        imagePath,
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
      <CardHeader>
        <CardTitle>Edit details</CardTitle>
      </CardHeader>
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
          <Label>Max capacity</Label>
          <Input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Event type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="Open">Open seating (ticket tiers)</option>
            <option value="Table">Table based (floor plan)</option>
            <option value="Both">Both (tiers + tables)</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>Image</Label>
          <ImageUpload entityType="event" entityId={event.eventsId} onUploaded={setImagePath} />
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
              <span className="block text-gray-500">
                On = buyers see one all-in total. Off = price + fee shown separately. The developer fee amount is
                unchanged either way.
              </span>
            </span>
          </label>
        </div>
        {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <CardTitle>{value}</CardTitle>
        <p className="text-sm text-gray-500">{label}</p>
      </CardContent>
    </Card>
  );
}
