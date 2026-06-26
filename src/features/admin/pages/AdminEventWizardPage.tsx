import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, type EventDraft } from '@/features/admin/services/eventAdminService';
import { listVenues } from '@/features/admin/services/catalogService';
import type { Venue } from '@/shared/proto/catalog';
import { listEnums, type EnumOption } from '@/shared/enums';
import { toEpochString } from '@/shared/lib/format';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function AdminEventWizardPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<EnumOption[]>([]);
  const [category, setCategory] = useState('');
  const [eventTypes, setEventTypes] = useState<EnumOption[]>([]);
  const [eventType, setEventType] = useState('Open');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesId, setVenuesId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listVenues()
      .then((loaded) => {
        setVenues(loaded);
        if (loaded.length > 0) {
          setVenuesId(loaded[0].venuesId);
        }
      })
      .catch((caught) => setError(rpcErrorMessage(caught)));
    listEnums('EventCategory')
      .then((loaded) => {
        setCategories(loaded);
        if (loaded.length > 0) {
          setCategory(loaded[0].value);
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
      startDate: toEpochString(start),
      endDate: toEpochString(end),
      maxCapacity: capacity,
      // Open seating has no floor plan; Table/Both need the grid layout.
      layoutMode: eventType === 'Open' ? 'Open' : 'Grid',
      eventType,
      venuesId,
      gridRows: 0,
      gridCols: 0,
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
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>New event</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Title" value={title} onChange={setTitle} />
        <div className="space-y-1">
          <Label>Category</Label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Event type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
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
          </select>
        </div>
        <div className="space-y-1">
          <Label>Venue</Label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            value={venuesId}
            onChange={(e) => setVenuesId(e.target.value)}
          >
            {venues.length === 0 ? <option value="">No venues — create one first</option> : null}
            {venues.map((venue) => (
              <option key={venue.venuesId} value={venue.venuesId}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Max capacity</Label>
          <Input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Start</Label>
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>End</Label>
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2">
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create event'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
