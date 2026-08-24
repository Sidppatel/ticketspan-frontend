import { ticketClient, bookingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { Ticket, Booking } from '@/shared/proto/bookings';
import type { AckResponse } from '@/shared/proto/common';

function requireAck(ack: AckResponse): void {
  if (!ack.success) {
    throw new Error(ack.message || 'Request failed');
  }
}

export async function getBooking(bookingsId: string): Promise<Booking> {
  return callRpc(() => bookingClient.getBooking({ value: bookingsId }));
}

export async function listTickets(bookingsId: string): Promise<Ticket[]> {
  const response = await callRpc(() => ticketClient.listTickets({ value: bookingsId }));
  return response.tickets;
}

export async function inviteTicket(ticketsId: string, email: string): Promise<string> {
  const ack = await callRpc(() => ticketClient.inviteTicket({ ticketsId, email }));
  requireAck(ack);
  return ack.message;
}

export function getClaimUrl(token: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/claim?token=${encodeURIComponent(token)}`;
  }
  return `/claim?token=${encodeURIComponent(token)}`;
}

export async function claimTicket(token: string): Promise<void> {
  requireAck(await callRpc(() => ticketClient.claimTicket({ token })));
}

export async function claimTicketSelf(ticketsId: string): Promise<void> {
  requireAck(await callRpc(() => ticketClient.claimTicketSelf({ value: ticketsId })));
}

export async function revokeTicket(ticketsId: string): Promise<void> {
  await callRpc(() => ticketClient.revokeTicket({ value: ticketsId }));
}

export async function listMyTickets(): Promise<Ticket[]> {
  const response = await callRpc(() => ticketClient.listMyTickets({}));
  return response.tickets;
}

export async function selfCheckInTicket(ticketsId: string): Promise<{ valid: boolean; message: string; holderName: string; status: string }> {
  return callRpc(() => ticketClient.selfCheckInTicket({ value: ticketsId }));
}

