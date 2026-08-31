import { eventClient, bookingClient, tableBookingClient, pricingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import { takePrefetchedEventBySlug, takePrefetchedEventList } from '@/shared/theme/brandingPrefetch';
import type { Event, EventImage, ScheduleItem } from '@/shared/proto/event';
import type { Booking } from '@/shared/proto/bookings';
import type { EventLayout } from '@/shared/proto/booking';
import type { PriceBreakdown } from '@/shared/proto/pricing';

export async function calculatePrice(pricesId: string, seats: number): Promise<PriceBreakdown> {
  return callRpc(() => pricingClient.calculatePrice({ pricesId, seats, at: '0', remaining: -1, groupQty: 0 }));
}

export interface ListPublicEventsParams {
  offset?: number;
  limit?: number;
  search?: string;
  category?: string;
  tenantSlug?: string;
  dateFilter?: string;
  upcomingOnly?: boolean;
}

export async function listPublicEventsPaged(params: ListPublicEventsParams): Promise<{
  events: Event[];
  total: number;
}> {
  const response = await callRpc(() =>
    eventClient.listEvents({
      page: {
        offset: params.offset ?? 0,
        limit: params.limit ?? 15,
        search: params.search ?? '',
      },
      status: 'Published',
      category: params.category === 'All' ? '' : (params.category ?? ''),
      tenantSlug: params.tenantSlug === 'all' ? '' : (params.tenantSlug ?? ''),
      dateFilter: params.dateFilter === 'all' ? '' : (params.dateFilter ?? ''),
      upcomingOnly: params.upcomingOnly ?? true,
    }),
  );
  return {
    events: response.events,
    total: response.meta?.total ?? response.events.length,
  };
}

export async function listPublicEvents(search: string, category = ''): Promise<Event[]> {
  const prefetched = !search && !category ? takePrefetchedEventList() : null;
  const response = prefetched
    ? await prefetched
    : await callRpc(() =>
        eventClient.listEvents({
          page: { offset: 0, limit: 50, search },
          status: 'Published',
          category,
          tenantSlug: '',
          dateFilter: '',
          upcomingOnly: true,
        }),
      );
  return response.events;
}

export async function getEventBySlug(slug: string): Promise<Event> {
  const prefetched = takePrefetchedEventBySlug(slug);
  return prefetched ?? callRpc(() => eventClient.getEventBySlug({ slug }));
}

export async function listEventImages(eventsId: string, type: string): Promise<EventImage[]> {
  const response = await callRpc(() => eventClient.listEventImages({ eventsId, type }));
  return response.images;
}

export async function listScheduleItems(eventsId: string): Promise<ScheduleItem[]> {
  const response = await callRpc(() => eventClient.listScheduleItems({ value: eventsId }));
  return response.items;
}

export async function listMyBookings(options?: {
  status?: string;
  search?: string;
}): Promise<Booking[]> {
  const response = await callRpc(() =>
    bookingClient.listBookings({
      page: { offset: 0, limit: 50, search: options?.search ?? '' },
      eventsId: '',
      status: options?.status ?? '',
    }),
  );
  return response.bookings;
}

export interface ReserveSeatsInput {
  eventsId: string;
  seats: number;
  eventTicketTypesId: string;
}

export async function reserveOpenCapacity(input: ReserveSeatsInput): Promise<string> {
  const response = await callRpc(() =>
    bookingClient.reserveOpenCapacity({
      eventsId: input.eventsId,
      seats: input.seats,
      eventTicketTypesId: input.eventTicketTypesId,
      subtotalCents: 0,
      feeCents: 0,
      totalCents: 0,
    }),
  );
  return response.bookingNumber;
}

export async function getEventLayout(eventsId: string): Promise<EventLayout> {
  return callRpc(() => tableBookingClient.getEventLayout({ value: eventsId }));
}

export async function listEventTableTypes(eventsId: string) {
  const res = await callRpc(() => tableBookingClient.listEventTableTypes({ value: eventsId }));
  return res.tableTypes;
}

export interface TableBookingInput {
  eventsId: string;
  tablesId: string;
  seats: number;
}

export async function bookingTable(input: TableBookingInput): Promise<string> {
  const response = await callRpc(() =>
    bookingClient.createBooking({
      eventsId: input.eventsId,
      tablesId: input.tablesId,
      seats: input.seats,
      eventTicketTypesId: '',
      subtotalCents: 0,
      feeCents: 0,
      totalCents: 0,
    }),
  );
  return response.bookingNumber;
}
