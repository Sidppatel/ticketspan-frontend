import { checkInClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { ScanResponse, CheckInStats, StaffEvent, GuestBooking, LookupBookingResponse } from '@/shared/proto/bookings';

export async function scanTicket(qrToken: string, eventsId: string): Promise<ScanResponse> {
  return callRpc(() => checkInClient.scan({ qrToken, eventsId }));
}

export async function getCheckInStats(eventsId: string): Promise<CheckInStats> {
  return callRpc(() => checkInClient.getCheckInStats({ value: eventsId }));
}

export async function listEventsForStaff(): Promise<StaffEvent[]> {
  const response = await callRpc(() => checkInClient.listEventsForStaff({}));
  return response.events || [];
}

export async function getGuestList(eventsId: string): Promise<GuestBooking[]> {
  const response = await callRpc(() => checkInClient.getGuestList({ value: eventsId }));
  return response.bookings || [];
}

export async function checkInGuest(eventsId: string, codeOrId: string, type: 'Booking' | 'Ticket'): Promise<ScanResponse> {
  return callRpc(() => checkInClient.checkInGuest({ eventsId, codeOrId, type }));
}

export async function lookupBooking(eventsId: string, codeOrId: string): Promise<LookupBookingResponse> {
  return callRpc(() => checkInClient.lookupBooking({ eventsId, codeOrId, type: 'Booking' }));
}

export async function uncheckInTicket(eventsId: string, ticketsId: string, reason: string): Promise<ScanResponse> {
  return callRpc(() => checkInClient.uncheckInTicket({ eventsId, ticketsId, reason }));
}
