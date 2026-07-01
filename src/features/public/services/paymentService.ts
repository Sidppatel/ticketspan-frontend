import { bookingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type {
  PaymentIntentResponse,
  PaymentStatusResponse,
  EventTicketType,
  CartQuote,
} from '@/shared/proto/bookings';

export async function listEventTicketTypes(eventsId: string): Promise<EventTicketType[]> {
  const response = await callRpc(() => bookingClient.listEventTicketTypes({ value: eventsId }));
  return response.ticketTypes;
}

export interface ReserveResult {
  bookingsId: string;
  bookingNumber: string;
}

export interface ReserveSeatsInput {
  eventsId: string;
  seats: number;
  eventTicketTypesId: string;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
}

export async function reserveOpenCapacity(input: ReserveSeatsInput): Promise<ReserveResult> {
  const response = await callRpc(() =>
    bookingClient.reserveOpenCapacity({
      eventsId: input.eventsId,
      seats: input.seats,
      eventTicketTypesId: input.eventTicketTypesId,
      subtotalCents: input.subtotalCents,
      feeCents: input.feeCents,
      totalCents: input.totalCents,
    }),
  );
  return { bookingsId: response.bookingsId, bookingNumber: response.bookingNumber };
}

export interface ReserveTableInput {
  eventsId: string;
  tablesId: string;
  seats: number;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
}

export async function reserveTable(input: ReserveTableInput): Promise<ReserveResult> {
  const response = await callRpc(() =>
    bookingClient.createBooking({
      eventsId: input.eventsId,
      tablesId: input.tablesId,
      seats: input.seats,
      eventTicketTypesId: '',
      subtotalCents: input.subtotalCents,
      feeCents: input.feeCents,
      totalCents: input.totalCents,
    }),
  );
  return { bookingsId: response.bookingsId, bookingNumber: response.bookingNumber };
}

export interface CartLineInput {
  kind: 'Ticket' | 'Table';
  refId: string; // event_ticket_types_id (Ticket) or tables_id (Table)
  seats: number; // ticket quantity; ignored for tables (server uses capacity)
}

// Cart checkout: one booking aggregating many ticket/table lines, one payment.
export async function createMultiBooking(eventsId: string, lines: CartLineInput[]): Promise<ReserveResult> {
  const response = await callRpc(() =>
    bookingClient.createMultiBooking({
      eventsId,
      lines: lines.map((l) => ({ kind: l.kind, refId: l.refId, seats: l.seats })),
    }),
  );
  return { bookingsId: response.bookingsId, bookingNumber: response.bookingNumber };
}

export async function quoteCart(eventsId: string, lines: CartLineInput[]): Promise<CartQuote> {
  return callRpc(() =>
    bookingClient.quoteCart({
      eventsId,
      lines: lines.map((l) => ({ kind: l.kind, refId: l.refId, seats: l.seats })),
    }),
  );
}

export async function createPaymentIntent(bookingsId: string): Promise<PaymentIntentResponse> {
  return callRpc(() => bookingClient.createPaymentIntent({ bookingsId }));
}

export async function getPaymentStatus(bookingsId: string): Promise<PaymentStatusResponse> {
  return callRpc(() => bookingClient.getPaymentStatus({ value: bookingsId }));
}

export async function cancelBooking(bookingsId: string): Promise<void> {
  await callRpc(() => bookingClient.cancelBooking({ value: bookingsId }));
}

export async function getBooking(bookingsId: string) {
  return callRpc(() => bookingClient.getBooking({ value: bookingsId }));
}
