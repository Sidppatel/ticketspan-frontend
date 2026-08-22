import { httpGet, httpPost } from './httpClient';
import type {
  ApiEnvelope,
  CheckInStatsApiResponse,
  GuestBookingDto,
  ManualCheckInApiRequest,
  ScanTicketApiRequest,
  ScanTicketApiResponse,
  StaffAssignedEventDto,
} from './types';

export const checkInApi = {
  scanTicket(payload: ScanTicketApiRequest): Promise<ApiEnvelope<ScanTicketApiResponse>> {
    return httpPost<ApiEnvelope<ScanTicketApiResponse>, ScanTicketApiRequest>('/api/v1/checkin/scan', payload);
  },

  manualCheckIn(payload: ManualCheckInApiRequest): Promise<ApiEnvelope<ScanTicketApiResponse>> {
    return httpPost<ApiEnvelope<ScanTicketApiResponse>, ManualCheckInApiRequest>('/api/v1/checkin/manual', payload);
  },

  getStaffEvents(): Promise<ApiEnvelope<StaffAssignedEventDto[]>> {
    return httpGet<ApiEnvelope<StaffAssignedEventDto[]>>('/api/v1/checkin/events');
  },

  getGuestList(eventId: string): Promise<ApiEnvelope<GuestBookingDto[]>> {
    return httpGet<ApiEnvelope<GuestBookingDto[]>>(`/api/v1/checkin/guest-list/${eventId}`);
  },

  getCheckInStats(eventId: string): Promise<ApiEnvelope<CheckInStatsApiResponse>> {
    return httpGet<ApiEnvelope<CheckInStatsApiResponse>>(`/api/v1/checkin/stats/${eventId}`);
  },
};
