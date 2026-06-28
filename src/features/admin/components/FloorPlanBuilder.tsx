import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { getEventLayout, saveEventLayout } from '@/features/admin/services/layoutService';
import { listEventTableTypes, deleteEventTable } from '@/features/admin/services/eventAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import type { Table, LayoutObject } from '@/shared/proto/booking';
import type { EventTableType } from '@/shared/proto/booking';
import { Button } from '@/shared/ui/button';

type PlacedTable = {
  tablesId: string;
  eventTablesId: string;
  label: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  shapeOverride: string;
  colorOverride: string;
};
type PlacedObject = {
  layoutObjectsId: string;
  objectType: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  color: string;
};

const OBJECT_TYPES = ['Entry', 'Exit', 'Stage'];
const OBJECT_GLYPH: Record<string, string> = { Entry: '→', Exit: '←', Stage: '▭' };
const OBJECT_DEFAULT_COLOR: Record<string, string> = { Entry: '#059669', Exit: '#059669', Stage: '#059669' };
const CANVAS_W = 1000;
const CANVAS_H = 640;
const SNAP = 5;
const MIN_SIZE = 24;
const DEFAULT_SIZE = 80;

const snap = (n: number) => Math.round(n / SNAP) * SNAP;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function shapeClass(shape: string): string {
  switch (shape) {
    case 'Round':
    case 'Cocktail':
      return 'rounded-full';
    case 'Square':
      return 'rounded-none';
    default:
      return 'rounded-md'; // Rectangle
  }
}

// A live pointer-drag (move or resize) on a placed item.
type Drag = {
  kind: 'table' | 'object';
  mode: 'move' | 'resize';
  idx: number;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  moved: boolean;
};

/**
 * Free pixel-canvas floor-plan builder. Drag a palette table type or an
 * Entry/Exit/Stage object onto the canvas; drag placed items to move and the
 * corner handle to resize. Positions/sizes are absolute pixels (numeric(10,2));
 * overlaps are allowed. All edits are local until "Save layout" persists via
 * sp_save_event_layout.
 */
export function FloorPlanBuilder({
  eventsId,
  onTypesChanged,
  onLayoutSaved,
}: {
  eventsId: string;
  onTypesChanged?: () => void;
  onLayoutSaved?: () => void;
}) {
  const layoutLoader = useCallback(() => getEventLayout(eventsId), [eventsId]);
  const layout = useAsync(layoutLoader);
  const typesLoader = useCallback(() => listEventTableTypes(eventsId), [eventsId]);
  const types = useAsync(typesLoader);

  const [tables, setTables] = useState<PlacedTable[]>([]);
  const [objects, setObjects] = useState<PlacedObject[]>([]);
  // Selected placed item ("t<idx>" / "o<idx>") shows a delete button.
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const draftKey = `floorplan-draft:${eventsId}`;

  const [prevLayoutData, setPrevLayoutData] = useState<unknown>(null);
  if (layout.data && layout.data !== prevLayoutData) {
    setPrevLayoutData(layout.data);
    const draftRaw = window.localStorage.getItem(draftKey);
    const draft = draftRaw ? (JSON.parse(draftRaw) as { tables: PlacedTable[]; objects: PlacedObject[] }) : null;
    if (draft) {
      setTables(draft.tables);
      setObjects(draft.objects);
      setDirty(true);
    } else {
      setTables(
        layout.data.tables.map((t: Table) => ({
          tablesId: t.tablesId,
          eventTablesId: t.eventTablesId,
          label: t.label,
          posX: t.posX,
          posY: t.posY,
          width: t.width || DEFAULT_SIZE,
          height: t.height || DEFAULT_SIZE,
          shapeOverride: t.shapeOverride || '',
          colorOverride: t.colorOverride || '',
        })),
      );
      setObjects(
        layout.data.objects.map((o: LayoutObject) => ({
          layoutObjectsId: o.layoutObjectsId,
          objectType: o.objectType,
          posX: o.posX,
          posY: o.posY,
          width: o.width || DEFAULT_SIZE,
          height: o.height || DEFAULT_SIZE,
          color: o.color || OBJECT_DEFAULT_COLOR[o.objectType] || '#059669',
        })),
      );
      setDirty(false);
    }
  }

  useEffect(() => {
    if (!dirty) return;
    window.localStorage.setItem(draftKey, JSON.stringify({ tables, objects }));
  }, [tables, objects, dirty, draftKey]);

  const typeList = useMemo(() => types.data ?? [], [types.data]);
  const typeById = useMemo(() => {
    const m = new Map<string, EventTableType>();
    typeList.forEach((t) => m.set(t.eventTablesId, t));
    return m;
  }, [typeList]);

  function nextTableLabel(typeId: string) {
    const typeName = typeById.get(typeId)?.label || 'Table';
    const used = new Set(tables.filter((t) => t.eventTablesId === typeId).map((t) => t.label));
    let n = 1;
    while (used.has(`${typeName} - ${n}`)) n += 1;
    return `${typeName} - ${n}`;
  }

  // Pointer position relative to the canvas origin.
  function canvasPoint(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  // True if the rect would overlap any table other than ignoreIdx (AABB).
  function tableOverlap(x: number, y: number, w: number, h: number, ignoreIdx: number): boolean {
    return tables.some(
      (t, i) =>
        i !== ignoreIdx &&
        x < t.posX + t.width && x + w > t.posX &&
        y < t.posY + t.height && y + h > t.posY,
    );
  }

  function placeTable(typeId: string, cx: number, cy: number) {
    const t = typeById.get(typeId);
    const w = Math.max(MIN_SIZE, t?.defaultWidth || DEFAULT_SIZE);
    const h = Math.max(MIN_SIZE, t?.defaultHeight || DEFAULT_SIZE);
    const px = clamp(snap(cx - w / 2), 0, CANVAS_W - w);
    const py = clamp(snap(cy - h / 2), 0, CANVAS_H - h);
    if (tableOverlap(px, py, w, h, -1)) {
      setNotice("No room here — tables can't overlap");
      return;
    }
    setTables((prev) => [
      ...prev,
      {
        tablesId: '', eventTablesId: typeId, label: nextTableLabel(typeId),
        posX: px, posY: py, width: w, height: h, shapeOverride: '', colorOverride: '',
      },
    ]);
    setDirty(true);
  }

  function placeObject(objectType: string, cx: number, cy: number) {
    setObjects((prev) => [
      ...prev,
      {
        layoutObjectsId: '', objectType,
        posX: clamp(snap(cx - DEFAULT_SIZE / 2), 0, CANVAS_W - DEFAULT_SIZE),
        posY: clamp(snap(cy - DEFAULT_SIZE / 2), 0, CANVAS_H - DEFAULT_SIZE),
        width: DEFAULT_SIZE, height: DEFAULT_SIZE,
        color: OBJECT_DEFAULT_COLOR[objectType] || '#059669',
      },
    ]);
    setDirty(true);
  }

  // --- Palette drag-and-drop onto the canvas ---
  function onCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    setNotice(null);
    let payload: { drag: string; typeId?: string; objectType?: string };
    try {
      payload = JSON.parse(e.dataTransfer.getData('application/json'));
    } catch {
      return;
    }
    const { x, y } = canvasPoint(e.clientX, e.clientY);
    if (payload.drag === 'new-table' && payload.typeId) placeTable(payload.typeId, x, y);
    else if (payload.drag === 'new-object' && payload.objectType) placeObject(payload.objectType, x, y);
  }

  function startPaletteDrag(e: React.DragEvent, payload: object) {
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  }

  // --- Move / resize of placed items via pointer capture ---
  function onItemPointerDown(
    e: ReactPointerEvent,
    kind: 'table' | 'object',
    mode: 'move' | 'resize',
    idx: number,
  ) {
    e.preventDefault();
    e.stopPropagation();
    const item = kind === 'table' ? tables[idx] : objects[idx];
    if (!item) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      kind, mode, idx,
      startX: e.clientX, startY: e.clientY,
      origX: item.posX, origY: item.posY, origW: item.width, origH: item.height,
      moved: false,
    };
  }

  function onItemPointerMove(e: ReactPointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;

    if (d.kind === 'table') {
      const base = tables[d.idx];
      if (!base) return;
      let nx = base.posX, ny = base.posY, nw = base.width, nh = base.height;
      if (d.mode === 'move') {
        nx = clamp(snap(d.origX + dx), 0, CANVAS_W - base.width);
        ny = clamp(snap(d.origY + dy), 0, CANVAS_H - base.height);
      } else {
        nw = clamp(snap(d.origW + dx), MIN_SIZE, CANVAS_W - base.posX);
        nh = clamp(snap(d.origH + dy), MIN_SIZE, CANVAS_H - base.posY);
      }
      // Reject the step that would overlap another table; item stays put.
      if (tableOverlap(nx, ny, nw, nh, d.idx)) {
        setNotice("Tables can't overlap");
        return;
      }
      setTables((prev) => prev.map((x, i) => (i === d.idx ? { ...x, posX: nx, posY: ny, width: nw, height: nh } : x)));
      setDirty(true);
      return;
    }

    setObjects((prev) =>
      prev.map((x, i) => {
        if (i !== d.idx) return x;
        if (d.mode === 'move') {
          return {
            ...x,
            posX: clamp(snap(d.origX + dx), 0, CANVAS_W - x.width),
            posY: clamp(snap(d.origY + dy), 0, CANVAS_H - x.height),
          };
        }
        return {
          ...x,
          width: clamp(snap(d.origW + dx), MIN_SIZE, CANVAS_W - x.posX),
          height: clamp(snap(d.origH + dy), MIN_SIZE, CANVAS_H - x.posY),
        };
      }),
    );
    setDirty(true);
  }

  function onItemPointerUp(e: ReactPointerEvent, kind: 'table' | 'object', idx: number) {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    // A click without movement selects the item (toggles its delete button).
    if (!d.moved) {
      const key = `${kind === 'table' ? 't' : 'o'}${idx}`;
      setSelected((cur) => (cur === key ? null : key));
    }
    void e;
  }

  function deleteTable(idx: number) {
    setTables((prev) => prev.filter((_, i) => i !== idx));
    setSelected(null);
    setDirty(true);
  }

  function deleteObject(idx: number) {
    setObjects((prev) => prev.filter((_, i) => i !== idx));
    setSelected(null);
    setDirty(true);
  }

  // Delete a table TYPE: removes the type and every placed table of it (server
  // cascades via sp_delete_event_table), then reloads palette + layout.
  async function deleteType(typeId: string, label: string) {
    if (!window.confirm(`Delete table type "${label}" and all its placed tables?`)) return;
    setNotice(null);
    try {
      await deleteEventTable(typeId);
      setTables((prev) => prev.filter((t) => t.eventTablesId !== typeId));
      setSelected(null);
      types.reload();
      layout.reload();
      onTypesChanged?.(); // refresh the Pricing panel (the linked price is gone too)
      onLayoutSaved?.();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  async function save() {
    setSaving(true);
    setNotice(null);
    try {
      await saveEventLayout(
        eventsId,
        tables.map(
          (t) =>
            ({
              tablesId: t.tablesId,
              eventTablesId: t.eventTablesId,
              label: t.label,
              posX: t.posX,
              posY: t.posY,
              width: t.width,
              height: t.height,
              shapeOverride: t.shapeOverride,
              colorOverride: t.colorOverride,
              capacityOverride: 0,
            }) as Table,
        ),
        objects.map(
          (o) =>
            ({
              layoutObjectsId: o.layoutObjectsId,
              objectType: o.objectType,
              label: '',
              posX: o.posX,
              posY: o.posY,
              width: o.width,
              height: o.height,
              color: o.color,
              sortOrder: 0,
            }) as LayoutObject,
        ),
      );
      setDirty(false);
      window.localStorage.removeItem(draftKey);
      setNotice('Layout saved');
      layout.reload();
      onLayoutSaved?.();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {notice ? <p className="text-sm text-amber-foreground">{notice}</p> : null}

      <div className="flex flex-wrap items-end gap-3">
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save layout' : 'Saved'}
        </Button>
      </div>

      {/* Palette */}
      <div className="flex flex-wrap gap-2">
        {typeList.map((t: EventTableType) => (
          <span key={t.eventTablesId}
            className="inline-flex items-center overflow-hidden rounded-md border border-input">
            <button type="button" draggable
              onDragStart={(e) => startPaletteDrag(e, { drag: 'new-table', typeId: t.eventTablesId })}
              className="cursor-grab px-2 py-1 text-sm hover:bg-muted">
              {t.label} · {t.defaultWidth}×{t.defaultHeight}px · {centsToUSD(t.priceCents)}
            </button>
            <button type="button" title="Delete table type and all its placed tables"
              onClick={() => deleteType(t.eventTablesId, t.label)}
              className="border-l border-input px-2 py-1 text-sm text-destructive hover:bg-destructive/10">
              ×
            </button>
          </span>
        ))}
        {typeList.length === 0 ? <p className="text-sm text-muted-foreground">Add table types above to place them.</p> : null}
        {OBJECT_TYPES.map((o) => (
          <Button key={o} size="sm" draggable
            onDragStart={(e) => startPaletteDrag(e, { drag: 'new-object', objectType: o })}
            variant="outline">
            {OBJECT_GLYPH[o]} {o}
          </Button>
        ))}
      </div>

      {/* Canvas */}
      <div className="overflow-auto rounded-md border bg-muted">
        <div
          ref={canvasRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onCanvasDrop}
          className="relative"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            backgroundImage:
              'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
            backgroundSize: `${SNAP * 4}px ${SNAP * 4}px`,
          }}
        >
          {tables.map((t, i) => {
            const type = typeById.get(t.eventTablesId);
            const fill = t.colorOverride || type?.color || '#4f46e5';
            const sh = t.shapeOverride || type?.shape || 'Rectangle';
            return (
              <div
                key={`t${i}`}
                onPointerDown={(e) => onItemPointerDown(e, 'table', 'move', i)}
                onPointerMove={onItemPointerMove}
                onPointerUp={(e) => onItemPointerUp(e, 'table', i)}
                title={`${t.label} · ${sh} (drag to move, corner to resize, click to select)`}
                style={{
                  position: 'absolute', left: t.posX, top: t.posY, width: t.width, height: t.height,
                  backgroundColor: fill, touchAction: 'none',
                }}
                className={`flex cursor-move select-none items-center justify-center border text-xs font-medium text-white ${shapeClass(sh)} ${
                  selected === `t${i}` ? 'border-black ring-2 ring-black' : 'border-black/10'
                }`}
              >
                {selected === `t${i}` ? (
                  <input
                    value={t.label}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const label = e.target.value;
                      setTables((prev) => prev.map((x, idx) => (idx === i ? { ...x, label } : x)));
                      setDirty(true);
                    }}
                    className="z-10 w-[90%] rounded border-none bg-white/90 px-1 text-center text-[11px] text-black"
                  />
                ) : (
                  t.label
                )}
                {selected === `t${i}` ? (
                  <button type="button" title="Delete table"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => deleteTable(i)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-destructive text-[11px] leading-none text-white shadow">
                    ×
                  </button>
                ) : null}
                <span
                  onPointerDown={(e) => onItemPointerDown(e, 'table', 'resize', i)}
                  onPointerMove={onItemPointerMove}
                  onPointerUp={(e) => onItemPointerUp(e, 'table', i)}
                  className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize rounded-sm border border-white bg-black/40"
                />
              </div>
            );
          })}
          {objects.map((o, i) => (
            <div
              key={`o${i}`}
              onPointerDown={(e) => onItemPointerDown(e, 'object', 'move', i)}
              onPointerMove={onItemPointerMove}
              onPointerUp={(e) => onItemPointerUp(e, 'object', i)}
              title={`${o.objectType} (drag to move, corner to resize, click to select)`}
              style={{
                position: 'absolute', left: o.posX, top: o.posY, width: o.width, height: o.height,
                backgroundColor: o.color, touchAction: 'none',
              }}
              className={`flex cursor-move select-none items-center justify-center rounded text-xs text-white ${
                selected === `o${i}` ? 'border-2 border-black ring-2 ring-black' : 'border border-black/20'
              }`}
            >
              {OBJECT_GLYPH[o.objectType] ?? o.objectType[0]} {o.objectType}
              {selected === `o${i}` ? (
                <>
                  <input
                    type="color"
                    value={o.color}
                    title="Change color"
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const color = e.target.value;
                      setObjects((prev) => prev.map((x, idx) => (idx === i ? { ...x, color } : x)));
                      setDirty(true);
                    }}
                    className="absolute -bottom-2 -left-2 h-5 w-5 cursor-pointer rounded-full border border-white p-0 shadow"
                  />
                  <button type="button" title="Delete object"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => deleteObject(i)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-destructive text-[11px] leading-none text-white shadow">
                    ×
                  </button>
                </>
              ) : null}
              <span
                onPointerDown={(e) => onItemPointerDown(e, 'object', 'resize', i)}
                onPointerMove={onItemPointerMove}
                onPointerUp={(e) => onItemPointerUp(e, 'object', i)}
                className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize rounded-sm border border-white bg-black/40"
              />
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag a table type or object from the palette onto the canvas. Drag placed items to move, drag the
        corner handle to resize. Tables can't overlap each other. Click an item to select it, then use × to
        delete. Delete a palette table type (×) to remove it and all its placed tables.{dirty ? ' · Unsaved changes' : ''}
      </p>
    </div>
  );
}
