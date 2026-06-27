import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listAdminEvents } from '@/features/admin/services/adminService';
import { deleteEvent, changeEventStatus } from '@/features/admin/services/eventAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

export function AdminEventsPage() {
  const loader = useCallback(() => listAdminEvents(), []);
  const { data, loading, error, reload } = useAsync(loader);

  async function act(action: () => Promise<void>) {
    try {
      await action();
      reload();
    } catch (caught) {
      window.alert(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Events</h1>
        <Link to="/events/new">
          <Button size="sm">New event</Button>
        </Link>
      </div>
      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="space-y-2">
        {(data ?? []).map((event) => (
          <Card key={event.eventsId}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link to={`/events/${event.eventsId}`} className="font-medium text-primary">
                  {event.title}
                </Link>
                <span className="ml-2 text-sm text-muted-foreground">{event.status}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => act(() => changeEventStatus(event.eventsId, 'Published'))}>
                  Publish
                </Button>
                <Button size="sm" variant="outline" onClick={() => act(() => changeEventStatus(event.eventsId, 'Cancelled'))}>
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={() => act(() => deleteEvent(event.eventsId))}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!loading && (data ?? []).length === 0 ? <p className="text-muted-foreground">No events yet.</p> : null}
    </div>
  );
}
