import { httpGet } from './httpClient';
import type {
  ApiEnvelope,
  EventDetailDto,
  EventSummaryDto,
  PagedEnvelope,
  ScheduleItemDto,
  TableDto,
  TicketTypeDto,
} from './types';

export interface ListEventsParams {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const eventsApi = {
  listEvents(params?: ListEventsParams): Promise<PagedEnvelope<EventSummaryDto>> {
    return httpGet<PagedEnvelope<EventSummaryDto>>('/api/v1/events', { params });
  },

  getEvent(slugOrId: string): Promise<ApiEnvelope<EventDetailDto>> {
    return httpGet<ApiEnvelope<EventDetailDto>>(`/api/v1/events/${slugOrId}`);
  },

  getEventTicketTypes(eventId: string): Promise<ApiEnvelope<TicketTypeDto[]>> {
    return httpGet<ApiEnvelope<TicketTypeDto[]>>(`/api/v1/events/${eventId}/ticket-types`);
  },

  getEventTables(eventId: string): Promise<ApiEnvelope<TableDto[]>> {
    return httpGet<ApiEnvelope<TableDto[]>>(`/api/v1/events/${eventId}/tables`);
  },

  getEventSchedule(eventId: string): Promise<ApiEnvelope<ScheduleItemDto[]>> {
    return httpGet<ApiEnvelope<ScheduleItemDto[]>>(`/api/v1/events/${eventId}/schedule`);
  },
};
