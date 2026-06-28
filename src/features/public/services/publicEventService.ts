import { eventClient, bookingClient, tableBookingClient, pricingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { Event, EventImage } from '@/shared/proto/event';
import type { Booking } from '@/shared/proto/bookings';
import type { EventLayout } from '@/shared/proto/booking';
import type { PriceBreakdown } from '@/shared/proto/pricing';

// Server-authoritative price for a sellable from the Pricing Module. Consumed by
// the public floor plan — the client never computes the price itself.
export async function calculatePrice(pricesId: string, seats: number): Promise<PriceBreakdown> {
  return callRpc(() => pricingClient.calculatePrice({ pricesId, seats, at: '0', remaining: -1 }));
}

export async function listPublicEvents(search: string): Promise<Event[]> {
  const response = await callRpc(() =>
    eventClient.listEvents({ page: { offset: 0, limit: 50, search }, status: 'Published', category: '' }),
  );
  return response.events;
}

export async function getEventBySlug(slug: string): Promise<Event> {
  return callRpc(() => eventClient.getEventBySlug({ slug }));
}

export async function listEventImages(eventsId: string, type: string): Promise<EventImage[]> {
  const response = await callRpc(() => eventClient.listEventImages({ eventsId, type }));
  return response.images;
}

export async function listMyBookings(): Promise<Booking[]> {
  const response = await callRpc(() =>
    bookingClient.listBookings({ page: { offset: 0, limit: 50, search: '' }, eventsId: '', status: '' }),
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
