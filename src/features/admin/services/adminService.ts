import { dashboardClient, eventClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { AdminDashboard } from '@/shared/proto/admin';
import type { Event, EventStats } from '@/shared/proto/event';
import type { EventWithStats } from '@/features/admin/lib/dashboardInsights';

const DASHBOARD_CARD_LIMIT = 9;

export async function getAdminDashboard(): Promise<AdminDashboard> {
  return callRpc(() => dashboardClient.getAdminDashboard({}));
}

export async function listAdminEvents(): Promise<Event[]> {
  const response = await callRpc(() =>
    eventClient.listEvents({
      page: { offset: 0, limit: 100, search: '' },
      status: '',
      category: '',
      tenantSlug: '',
      dateFilter: '',
      upcomingOnly: false,
    }),
  );
  return response.events;
}

function activityRank(event: Event, nowSec: number): number {
  const end = Number(event.endDate) || 0;
  if (event.status === 'Cancelled') return 3;
  if (end > 0 && end < nowSec) return 2;
  if (event.status === 'Published') return 0;
  return 1;
}

export async function getDashboardEvents(): Promise<EventWithStats[]> {
  const events = await listAdminEvents();
  const nowSec = Math.floor(Date.now() / 1000);
  const selected = [...events]
    .sort((a, b) => {
      const byRank = activityRank(a, nowSec) - activityRank(b, nowSec);
      if (byRank !== 0) return byRank;
      return (Number(a.startDate) || 0) - (Number(b.startDate) || 0);
    })
    .slice(0, DASHBOARD_CARD_LIMIT);

  const stats = await Promise.all(
    selected.map((event) =>
      callRpc(() => eventClient.getEventStats({ value: event.eventsId }))
        .then((value): EventStats | null => value)
        .catch(() => null),
    ),
  );

  return selected.map((event, i) => ({ event, stats: stats[i] }));
}
