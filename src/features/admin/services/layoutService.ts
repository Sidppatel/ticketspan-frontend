import { tableBookingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { EventLayout, Table, LayoutObject } from '@/shared/proto/booking';

export async function getEventLayout(eventsId: string): Promise<EventLayout> {
  return callRpc(() => tableBookingClient.getEventLayout({ value: eventsId }));
}

function tableJson(t: Table) {
  return {
    Id: t.tablesId,
    EventTableId: t.eventTablesId,
    Label: t.label,
    PosX: t.posX,
    PosY: t.posY,
    Width: t.width || 80,
    Height: t.height || 80,
    IsActive: true,
    SortOrder: 0,
    ShapeOverride: t.shapeOverride || '',
    ColorOverride: t.colorOverride || '',
    CapacityOverride: t.capacityOverride ? String(t.capacityOverride) : '',
  };
}

function objectJson(o: LayoutObject) {
  return {
    Id: o.layoutObjectsId,
    ObjectType: o.objectType,
    Label: o.label || '',
    PosX: o.posX,
    PosY: o.posY,
    Width: o.width || 80,
    Height: o.height || 80,
    Color: o.color || '',
    SortOrder: o.sortOrder || 0,
  };
}

export async function saveEventLayout(
  eventsId: string,
  tables: Table[],
  objects: LayoutObject[],
  lockedIds: string[] = [],
): Promise<void> {
  await callRpc(() =>
    tableBookingClient.saveEventLayout({
      eventsId,
      tablesJson: JSON.stringify(tables.map(tableJson)),
      lockedIds,
      objectsJson: JSON.stringify(objects.map(objectJson)),
    }),
  );
}
