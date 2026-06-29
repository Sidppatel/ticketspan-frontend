import { ticketClient, bookingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { Ticket, Booking } from '@/shared/proto/bookings';

export async function getBooking(bookingsId: string): Promise<Booking> {
  return callRpc(() => bookingClient.getBooking({ value: bookingsId }));
}

export async function listTickets(bookingsId: string): Promise<Ticket[]> {
  const response = await callRpc(() => ticketClient.listTickets({ value: bookingsId }));
  return response.tickets;
}

export async function inviteTicket(ticketsId: string, email: string): Promise<void> {
  await callRpc(() => ticketClient.inviteTicket({ ticketsId, email }));
}

export async function claimTicket(token: string): Promise<void> {
  await callRpc(() => ticketClient.claimTicket({ token }));
}

export async function claimTicketSelf(ticketsId: string): Promise<void> {
  await callRpc(() => ticketClient.claimTicketSelf({ value: ticketsId }));
}

export async function revokeTicket(ticketsId: string): Promise<void> {
  await callRpc(() => ticketClient.revokeTicket({ value: ticketsId }));
}
