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
import { Select } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { DateTimePicker } from '@/shared/ui/date-time-picker';

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
      maxCapacity: 0,
      // Open seating has no floor plan; Table/Both need the grid layout.
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
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>New event</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Title" value={title} onChange={setTitle} />
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Event type</Label>
          <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
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
        </div>
        <div className="space-y-1">
          <Label>Venue</Label>
          <Select value={venuesId} onChange={(e) => setVenuesId(e.target.value)}>
            {venues.length === 0 ? <option value="">No venues — create one first</option> : null}
            {venues.map((venue) => (
              <option key={venue.venuesId} value={venue.venuesId}>
                {venue.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Start</Label>
          <DateTimePicker value={start} onChange={setStart} />
        </div>
        <div className="space-y-1">
          <Label>End</Label>
          <DateTimePicker value={end} onChange={setEnd} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
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
