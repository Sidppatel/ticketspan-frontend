import { httpGet, httpPost } from './httpClient';
import type {
  AckEnvelope,
  ApiEnvelope,
  DigitalTicketDto,
  InviteTicketApiRequest,
} from './types';

export const ticketsApi = {
  getMyTickets(): Promise<ApiEnvelope<DigitalTicketDto[]>> {
    return httpGet<ApiEnvelope<DigitalTicketDto[]>>('/api/v1/tickets/my');
  },

  getTicket(ticketId: string): Promise<ApiEnvelope<DigitalTicketDto>> {
    return httpGet<ApiEnvelope<DigitalTicketDto>>(`/api/v1/tickets/${ticketId}`);
  },

  claimTicket(ticketId: string): Promise<AckEnvelope> {
    return httpPost<AckEnvelope>(`/api/v1/tickets/${ticketId}/claim`);
  },

  inviteGuest(payload: InviteTicketApiRequest): Promise<AckEnvelope> {
    return httpPost<AckEnvelope, InviteTicketApiRequest>('/api/v1/tickets/invite', payload);
  },
};
