import { bookingClient, ticketClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { Booking, BookingStats, Ticket } from '@/shared/proto/bookings';

export async function listBookings(eventsId: string, status: string): Promise<Booking[]> {
  const response = await callRpc(() =>
    bookingClient.listBookings({ page: { offset: 0, limit: 100, search: '' }, eventsId, status }),
  );
  return response.bookings;
}

export async function getBooking(bookingsId: string): Promise<Booking> {
  return callRpc(() => bookingClient.getBooking({ value: bookingsId }));
}

export async function getBookingStats(eventsId: string): Promise<BookingStats> {
  return callRpc(() => bookingClient.getBookingStats({ value: eventsId }));
}

export async function confirmBooking(bookingsId: string, qrToken: string): Promise<void> {
  await callRpc(() => bookingClient.confirmBooking({ bookingsId, qrToken }));
}

export async function cancelBooking(bookingsId: string): Promise<void> {
  await callRpc(() => bookingClient.cancelBooking({ value: bookingsId }));
}

export async function listTickets(bookingsId: string): Promise<Ticket[]> {
  const response = await callRpc(() => ticketClient.listTickets({ value: bookingsId }));
  return response.tickets;
}

export async function inviteTicket(ticketsId: string, email: string): Promise<void> {
  await callRpc(() => ticketClient.inviteTicket({ ticketsId, email }));
}
