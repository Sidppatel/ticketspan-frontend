import { tableBookingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { EventLayout, Table, LayoutObject } from '@/shared/proto/booking';

export async function getEventLayout(eventsId: string): Promise<EventLayout> {
  return callRpc(() => tableBookingClient.getEventLayout({ value: eventsId }));
}

// Serializes tables/objects back into the PascalCase JSON shape consumed by
// sp_save_event_layout, preserving existing tables when only objects change.
function tableJson(t: Table) {
  return {
    Id: t.tablesId,
    EventTableId: t.eventTablesId,
    Label: t.label,
    GridRow: t.gridRow,
    GridCol: t.gridCol,
    RowSpan: t.rowSpan || 1,
    ColSpan: t.colSpan || 1,
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
    GridRow: o.gridRow,
    GridCol: o.gridCol,
    RowSpan: o.rowSpan || 1,
    ColSpan: o.colSpan || 1,
    Color: o.color || '',
    SortOrder: o.sortOrder || 0,
  };
}

export async function saveEventLayout(
  eventsId: string,
  gridRows: number,
  gridCols: number,
  tables: Table[],
  objects: LayoutObject[],
  lockedIds: string[] = [],
): Promise<void> {
  await callRpc(() =>
    tableBookingClient.saveEventLayout({
      eventsId,
      gridRows,
      gridCols,
      tablesJson: JSON.stringify(tables.map(tableJson)),
      lockedIds,
      objectsJson: JSON.stringify(objects.map(objectJson)),
    }),
  );
}
