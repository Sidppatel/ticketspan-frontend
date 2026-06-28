import { eventClient, tableBookingClient, bookingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { Event, EventStats, ScheduleItem } from '@/shared/proto/event';
import type { Table } from '@/shared/proto/booking';
import type { EventTicketType } from '@/shared/proto/bookings';

export interface EventDraft {
  title: string;
  slug: string;
  description: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string;
  layoutMode: string;
  eventType: string;
  venuesId: string;
  imagePath: string;
}

export async function createEvent(draft: EventDraft): Promise<string> {
  const response = await callRpc(() =>
    eventClient.createEvent({
      title: draft.title,
      slug: draft.slug,
      description: draft.description,
      status: draft.status,
      category: draft.category,
      startDate: draft.startDate,
      endDate: draft.endDate,
      imagePath: draft.imagePath,
      isFeatured: false,
      layoutMode: draft.layoutMode,
      eventType: draft.eventType,
      venuesId: draft.venuesId,
      scheduledPublishAt: '0',
    }),
  );
  return response.eventsId;
}

export async function updateEvent(eventsId: string, draft: EventDraft): Promise<void> {
  await callRpc(() =>
    eventClient.updateEvent({
      eventsId,
      title: draft.title,
      description: draft.description,
      category: draft.category,
      startDate: draft.startDate,
      endDate: draft.endDate,
      imagePath: draft.imagePath,
      isFeatured: false,
      venuesId: draft.venuesId,
      eventType: draft.eventType,
    }),
  );
}

export async function deleteEvent(eventsId: string): Promise<void> {
  await callRpc(() => eventClient.deleteEvent({ value: eventsId }));
}

export async function changeEventStatus(eventsId: string, status: string): Promise<void> {
  await callRpc(() => eventClient.changeEventStatus({ eventsId, status }));
}

export async function getEvent(eventsId: string): Promise<Event> {
  return callRpc(() => eventClient.getEvent({ value: eventsId }));
}

export async function getEventStats(eventsId: string): Promise<EventStats> {
  return callRpc(() => eventClient.getEventStats({ value: eventsId }));
}

export interface ScheduleItemDraft {
  title: string;
  typeCategory: string;
  startTime: string;
  endTime: string;
}

export async function listScheduleItems(eventsId: string): Promise<ScheduleItem[]> {
  const response = await callRpc(() => eventClient.listScheduleItems({ value: eventsId }));
  return response.items;
}

export async function createScheduleItem(
  eventsId: string,
  draft: ScheduleItemDraft,
): Promise<string> {
  const response = await callRpc(() =>
    eventClient.createScheduleItem({
      eventsId,
      title: draft.title,
      typeCategory: draft.typeCategory,
      startTime: draft.startTime,
      endTime: draft.endTime,
    }),
  );
  return response.value;
}

export async function updateScheduleItem(
  scheduleItemsId: string,
  draft: ScheduleItemDraft,
): Promise<void> {
  await callRpc(() =>
    eventClient.updateScheduleItem({
      scheduleItemsId,
      title: draft.title,
      typeCategory: draft.typeCategory,
      startTime: draft.startTime,
      endTime: draft.endTime,
    }),
  );
}

export async function deleteScheduleItem(scheduleItemsId: string): Promise<void> {
  await callRpc(() => eventClient.deleteScheduleItem({ value: scheduleItemsId }));
}

export interface TicketTypeDraft {
  eventsId: string;
  label: string;
  priceCents: number;
  feeFormulasId: string;
  maxQuantity: number;
  sortOrder: number;
  description: string;
  capacity: number;
}

export async function createTicketType(draft: TicketTypeDraft): Promise<string> {
  const response = await callRpc(() =>
    tableBookingClient.createEventTicketType({
      eventsId: draft.eventsId,
      label: draft.label,
      priceCents: draft.priceCents,
      feeFormulasId: draft.feeFormulasId,
      maxQuantity: draft.maxQuantity,
      sortOrder: draft.sortOrder,
      description: draft.description,
      capacity: draft.capacity,
    }),
  );
  return response.value;
}

export async function listTicketTypes(eventsId: string): Promise<EventTicketType[]> {
  const response = await callRpc(() => bookingClient.listEventTicketTypes({ value: eventsId }));
  return response.ticketTypes;
}

export async function deleteTicketType(eventTicketTypesId: string): Promise<void> {
  await callRpc(() => tableBookingClient.deleteEventTicketType({ value: eventTicketTypesId }));
}

export async function updateTicketType(
  eventTicketTypesId: string,
  draft: TicketTypeDraft,
): Promise<void> {
  await callRpc(() =>
    tableBookingClient.updateEventTicketType({
      eventTicketTypesId,
      label: draft.label,
      priceCents: draft.priceCents,
      feeFormulasId: draft.feeFormulasId,
      maxQuantity: draft.maxQuantity,
      sortOrder: draft.sortOrder,
      description: draft.description,
      capacity: draft.capacity,
      isActive: true,
    }),
  );
}

export async function listEventTables(eventsId: string): Promise<Table[]> {
  const response = await callRpc(() => tableBookingClient.listTablesForEvent({ value: eventsId }));
  return response.tables;
}

export interface TableDraft {
  eventsId: string;
  label: string;
  capacity: number;
  shape: string;
  color: string;
  priceCents: number;
  feeFormulasId: string;
  // Table pricing mode. Default all-inclusive: priceCents covers the whole table.
  // When false, priceCents is the base and perAttendeeCents is added per seat.
  isAllInclusive?: boolean;
  perAttendeeCents?: number;
  tableTemplatesId?: string;
  // Pixel footprint override; 0 = inherit catalog template default.
  width?: number;
  height?: number;
}

export async function createEventTable(draft: TableDraft): Promise<string> {
  const response = await callRpc(() =>
    tableBookingClient.createEventTable({
      eventsId: draft.eventsId,
      label: draft.label,
      capacity: draft.capacity,
      shape: draft.shape,
      color: draft.color,
      priceCents: draft.priceCents,
      feeFormulasId: draft.feeFormulasId,
      tableTemplatesId: draft.tableTemplatesId ?? '',
      isAllInclusive: draft.isAllInclusive ?? true,
      perAttendeeCents: draft.perAttendeeCents ?? 0,
      width: draft.width ?? 0,
      height: draft.height ?? 0,
    }),
  );
  return response.value;
}

export async function deleteEventTable(tablesId: string): Promise<void> {
  await callRpc(() => tableBookingClient.deleteEventTable({ value: tablesId }));
}

export async function setEventFeesIncluded(eventsId: string, feesIncluded: boolean): Promise<void> {
  await callRpc(() => eventClient.setEventFeesIncluded({ eventsId, feesIncluded }));
}

export async function listEventTableTypes(eventsId: string) {
  const response = await callRpc(() => tableBookingClient.listEventTableTypes({ value: eventsId }));
  return response.tableTypes;
}
