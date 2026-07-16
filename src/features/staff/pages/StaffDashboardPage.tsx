import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listEventsForStaff, getCheckInStats } from '@/features/staff/services/staffService';
import type { StaffEvent } from '@/shared/proto/bookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Calendar, MapPin, Scan, Sparkles, Radio } from 'lucide-react';

function splitEvents(events: StaffEvent[]) {
  const nowEpoch = Math.floor(Date.now() / 1000);
  const current = events.filter((ev) => Number(ev.startDate) <= nowEpoch && nowEpoch <= Number(ev.endDate));
  const upcoming = events.filter((ev) => Number(ev.startDate) > nowEpoch);
  return { current, upcoming };
}

function formatDate(epoch: number) {
  return new Intl.DateTimeFormat('default', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(epoch * 1000));
}

function CurrentEventCard({ event }: { event: StaffEvent }) {
  const navigate = useNavigate();
  const statsLoader = useCallback(() => getCheckInStats(event.eventsId), [event.eventsId]);
  const stats = useAsync(statsLoader);

  return (
    <Card className="border-2 border-primary/30 bg-card shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5" /> Happening Now
            </p>
            <CardTitle className="font-display text-xl font-bold leading-tight md:text-2xl">
              {event.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <span>{formatDate(Number(event.startDate))} – {formatDate(Number(event.endDate))}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <span>{event.venueName || 'Online/TBD'}</span>
          </div>
        </div>
        {stats.data && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-muted/30 border border-border px-2 py-3">
              <p className="font-display text-xl font-bold text-foreground">{stats.data.total}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Guests</p>
            </div>
            <div className="rounded-xl bg-success/10 border border-success/15 px-2 py-3">
              <p className="font-display text-xl font-bold text-success">{stats.data.checkedIn}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Checked In</p>
            </div>
            <div className="rounded-xl bg-primary/10 border border-primary/15 px-2 py-3">
              <p className="font-display text-xl font-bold text-primary">{stats.data.remaining}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Remaining</p>
            </div>
          </div>
        )}
        <Button
          onClick={() => navigate(`/staff/${event.eventsId}`)}
          className="w-full h-12 gap-2 font-semibold text-sm"
        >
          <Scan className="h-4 w-4" />
          Launch Check-In
        </Button>
      </CardContent>
    </Card>
  );
}

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const eventsLoader = useCallback(() => listEventsForStaff(), []);
  const events = useAsync(eventsLoader);
  const { current, upcoming } = splitEvents(events.data ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Staff Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Select an event to manage check-ins.
          </p>
        </div>
      </div>

      {events.loading ? (
        <p className="text-muted-foreground text-center py-12">Loading assigned events...</p>
      ) : events.error ? (
        <p className="text-destructive text-center py-12">{events.error}</p>
      ) : (events.data ?? []).length === 0 ? (
        <Card className="border-dashed border-2 py-12 text-center">
          <CardContent className="space-y-3">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/60" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No Active Events</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                You are not currently assigned to any active events within the check-in window (24 hours before/after).
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {current.length > 0 && (
            <div className="space-y-4">
              {current.map((ev) => (
                <CurrentEventCard key={ev.eventsId} event={ev} />
              ))}
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Upcoming Events
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {upcoming.map((ev) => (
                  <Card key={ev.eventsId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="font-display text-lg font-bold leading-tight">
                            {ev.title}
                          </CardTitle>
                          <p className="text-xs uppercase tracking-wider font-semibold text-primary">
                            {ev.status}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                          <span>{formatDate(Number(ev.startDate))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                          <span>{ev.venueName || 'Online/TBD'}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(`/staff/${ev.eventsId}`)}
                        className="w-full gap-2 font-semibold"
                      >
                        <Scan className="h-4 w-4" />
                        Launch Check-In
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {current.length === 0 && upcoming.length === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {(events.data ?? []).map((ev) => (
                <Card key={ev.eventsId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg font-bold leading-tight">
                      {ev.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                      <span>{formatDate(Number(ev.startDate))}</span>
                    </div>
                    <Button
                      onClick={() => navigate(`/staff/${ev.eventsId}`)}
                      className="w-full gap-2 font-semibold"
                    >
                      <Scan className="h-4 w-4" />
                      Launch Check-In
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
