import { useCallback, useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { getEventLayout, saveEventLayout } from '@/features/admin/services/layoutService';
import { listEventTableTypes } from '@/features/admin/services/eventAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import type { Table, LayoutObject } from '@/shared/proto/booking';
import type { EventTableType } from '@/shared/proto/booking';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

type PlacedTable = {
  tablesId: string;
  eventTablesId: string;
  label: string;
  gridRow: number;
  gridCol: number;
  rowSpan: number;
  colSpan: number;
  shapeOverride: string;
  colorOverride: string;
};
type PlacedObject = {
  layoutObjectsId: string;
  objectType: string;
  gridRow: number;
  gridCol: number;
};
type Tool =
  | { kind: 'table'; typeId: string; label: string }
  | { kind: 'object'; objectType: string }
  | { kind: 'erase' }
  | null;

const OBJECT_TYPES = ['Entry', 'Exit', 'Stage'];
const OBJECT_GLYPH: Record<string, string> = { Entry: '→', Exit: '←', Stage: '▭' };
const SHAPES = ['Round', 'Rectangle', 'Square', 'Cocktail'];
const CELL = 2.5; // rem

function shapeClass(shape: string): string {
  switch (shape) {
    case 'Round':
      return 'rounded-full';
    case 'Square':
      return 'rounded-none';
    case 'Cocktail':
      return 'rounded-full';
    default:
      return 'rounded-md'; // Rectangle
  }
}

/**
 * Visual grid floor-plan builder. Rows × cols define the grid. Pick a palette
 * table type (placed with the chosen row/col span, shape and color) or an
 * Entry/Exit/Stage object, then click a cell to place. Multi-cell tables reserve
 * their whole footprint — overlaps and out-of-bounds placements are rejected.
 * All edits are local until "Save layout" persists via sp_save_event_layout.
 */
export function FloorPlanBuilder({ eventsId }: { eventsId: string }) {
  const layoutLoader = useCallback(() => getEventLayout(eventsId), [eventsId]);
  const layout = useAsync(layoutLoader);
  const typesLoader = useCallback(() => listEventTableTypes(eventsId), [eventsId]);
  const types = useAsync(typesLoader);

  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [tables, setTables] = useState<PlacedTable[]>([]);
  const [objects, setObjects] = useState<PlacedObject[]>([]);
  const [tool, setTool] = useState<Tool>(null);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Placement overrides applied to the next table dropped on the grid. The grid
  // footprint (row/col span) comes from the table type itself, not set here.
  const [shape, setShape] = useState('');
  const [color, setColor] = useState('');

  const [prevLayoutData, setPrevLayoutData] = useState<unknown>(null);
  if (layout.data && layout.data !== prevLayoutData) {
    setPrevLayoutData(layout.data);
    setRows(layout.data.gridRows || 6);
    setCols(layout.data.gridCols || 6);
    setTables(
      layout.data.tables.map((t: Table) => ({
        tablesId: t.tablesId,
        eventTablesId: t.eventTablesId,
        label: t.label,
        gridRow: t.gridRow,
        gridCol: t.gridCol,
        rowSpan: t.rowSpan || 1,
        colSpan: t.colSpan || 1,
        shapeOverride: t.shapeOverride || '',
        colorOverride: t.colorOverride || '',
      })),
    );
    setObjects(
      layout.data.objects.map((o: LayoutObject) => ({
        layoutObjectsId: o.layoutObjectsId,
        objectType: o.objectType,
        gridRow: o.gridRow,
        gridCol: o.gridCol,
      })),
    );
    setDirty(false);
  }

  const typeList = useMemo(() => types.data ?? [], [types.data]);
  const typeById = useMemo(() => {
    const m = new Map<string, EventTableType>();
    typeList.forEach((t) => m.set(t.eventTablesId, t));
    return m;
  }, [typeList]);

  // Map every covered cell -> owner key, accounting for table footprints.
  const covered = useMemo(() => {
    const m = new Map<string, string>();
    tables.forEach((t, i) => {
      for (let r = t.gridRow; r < t.gridRow + t.rowSpan; r += 1)
        for (let c = t.gridCol; c < t.gridCol + t.colSpan; c += 1) m.set(`${r}:${c}`, `t${i}`);
    });
    objects.forEach((o, i) => m.set(`${o.gridRow}:${o.gridCol}`, `o${i}`));
    return m;
  }, [tables, objects]);

  function nextTableLabel() {
    let n = tables.length + 1;
    const used = new Set(tables.map((t) => t.label));
    while (used.has(`T${n}`)) n += 1;
    return `T${n}`;
  }

  // ignoreOwner = the covered-map owner key to skip (used when moving an item so
  // it doesn't collide with its own current footprint).
  function footprintFree(r: number, c: number, rs: number, cs: number, ignoreOwner?: string): boolean {
    if (r < 0 || c < 0 || r + rs > rows || c + cs > cols) return false;
    for (let rr = r; rr < r + rs; rr += 1)
      for (let cc = c; cc < c + cs; cc += 1) {
        const owner = covered.get(`${rr}:${cc}`);
        if (owner && owner !== ignoreOwner) return false;
      }
    return true;
  }

  // Drag payloads: a new palette item, or a move of an existing placed item.
  type DragPayload =
    | { drag: 'new-table'; typeId: string }
    | { drag: 'new-object'; objectType: string }
    | { drag: 'move-table'; idx: number }
    | { drag: 'move-object'; idx: number };

  function onDrop(r: number, c: number, e: DragEvent) {
    e.preventDefault();
    setNotice(null);
    let payload: DragPayload;
    try {
      payload = JSON.parse(e.dataTransfer.getData('application/json'));
    } catch {
      return;
    }
    if (payload.drag === 'new-table') {
      const placeType = typeById.get(payload.typeId);
      const rs = Math.max(1, placeType?.rowSpan || 1);
      const cs = Math.max(1, placeType?.colSpan || 1);
      if (!footprintFree(r, c, rs, cs)) {
        setNotice('No room here — overlaps or off-grid');
        return;
      }
      setTables((prev) => [
        ...prev,
        {
          tablesId: '', eventTablesId: payload.typeId, label: nextTableLabel(),
          gridRow: r, gridCol: c, rowSpan: rs, colSpan: cs, shapeOverride: shape, colorOverride: color,
        },
      ]);
      setDirty(true);
    } else if (payload.drag === 'new-object') {
      if (covered.has(`${r}:${c}`)) { setNotice('Cell occupied'); return; }
      setObjects((prev) => [...prev, { layoutObjectsId: '', objectType: payload.objectType, gridRow: r, gridCol: c }]);
      setDirty(true);
    } else if (payload.drag === 'move-table') {
      const t = tables[payload.idx];
      if (!t) return;
      if (!footprintFree(r, c, t.rowSpan, t.colSpan, `t${payload.idx}`)) {
        setNotice('No room here — overlaps or off-grid');
        return;
      }
      setTables((prev) => prev.map((x, i) => (i === payload.idx ? { ...x, gridRow: r, gridCol: c } : x)));
      setDirty(true);
    } else if (payload.drag === 'move-object') {
      if (covered.has(`${r}:${c}`)) { setNotice('Cell occupied'); return; }
      setObjects((prev) => prev.map((x, i) => (i === payload.idx ? { ...x, gridRow: r, gridCol: c } : x)));
      setDirty(true);
    }
  }

  function startDrag(e: DragEvent, payload: DragPayload) {
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  }

  function clickCell(r: number, c: number) {
    setNotice(null);
    const owner = covered.get(`${r}:${c}`);

    if (tool?.kind === 'erase' || owner) {
      if (owner?.startsWith('t')) {
        const idx = Number(owner.slice(1));
        setTables((prev) => prev.filter((_, i) => i !== idx));
        setDirty(true);
      } else if (owner?.startsWith('o')) {
        const idx = Number(owner.slice(1));
        setObjects((prev) => prev.filter((_, i) => i !== idx));
        setDirty(true);
      }
      return;
    }
    if (!tool) {
      setNotice('Pick a palette item first');
      return;
    }
    if (tool.kind === 'table') {
      const placeType = typeById.get(tool.typeId);
      const rs = Math.max(1, placeType?.rowSpan || 1);
      const cs = Math.max(1, placeType?.colSpan || 1);
      if (!footprintFree(r, c, rs, cs)) {
        setNotice('No room here — overlaps another table/object or goes off-grid');
        return;
      }
      setTables((prev) => [
        ...prev,
        {
          tablesId: '',
          eventTablesId: tool.typeId,
          label: nextTableLabel(),
          gridRow: r,
          gridCol: c,
          rowSpan: rs,
          colSpan: cs,
          shapeOverride: shape,
          colorOverride: color,
        },
      ]);
      setDirty(true);
    } else if (tool.kind === 'object') {
      if (covered.has(`${r}:${c}`)) {
        setNotice('Cell occupied');
        return;
      }
      setObjects((prev) => [...prev, { layoutObjectsId: '', objectType: tool.objectType, gridRow: r, gridCol: c }]);
      setDirty(true);
    }
  }

  async function save() {
    setSaving(true);
    setNotice(null);
    try {
      await saveEventLayout(
        eventsId,
        rows,
        cols,
        tables.map(
          (t) =>
            ({
              tablesId: t.tablesId,
              eventTablesId: t.eventTablesId,
              label: t.label,
              gridRow: t.gridRow,
              gridCol: t.gridCol,
              rowSpan: t.rowSpan,
              colSpan: t.colSpan,
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
              gridRow: o.gridRow,
              gridCol: o.gridCol,
              rowSpan: 1,
              colSpan: 1,
              color: '',
              sortOrder: 0,
            }) as LayoutObject,
        ),
      );
      setDirty(false);
      setNotice('Layout saved');
      layout.reload();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  const isSelected = (t: Tool) =>
    !!tool && !!t && tool.kind === t.kind &&
    (t.kind !== 'table' || (tool.kind === 'table' && tool.typeId === t.typeId)) &&
    (t.kind !== 'object' || (tool.kind === 'object' && tool.objectType === t.objectType));

  // Empty (uncovered, in-bounds) cells for the click targets.
  const emptyCells: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < rows; r += 1)
    for (let c = 0; c < cols; c += 1) if (!covered.has(`${r}:${c}`)) emptyCells.push({ r, c });

  return (
    <div className="space-y-3">
      {notice ? <p className="text-sm text-amber-700">{notice}</p> : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Rows</Label>
          <Input className="w-20" type="number" min={1} value={rows}
            onChange={(e) => { setRows(Math.max(1, Number(e.target.value))); setDirty(true); }} />
        </div>
        <div className="space-y-1">
          <Label>Cols</Label>
          <Input className="w-20" type="number" min={1} value={cols}
            onChange={(e) => { setCols(Math.max(1, Number(e.target.value))); setDirty(true); }} />
        </div>
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save layout' : 'Saved'}
        </Button>
      </div>

      {/* Placement overrides for the next table (footprint comes from the type) */}
      <div className="flex flex-wrap items-end gap-3 rounded-md border bg-gray-50 p-2">
        <div className="space-y-1">
          <Label>Shape</Label>
          <select className="h-9 rounded-md border border-gray-300 px-2 text-sm"
            value={shape} onChange={(e) => setShape(e.target.value)}>
            <option value="">Inherit type</option>
            {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Color</Label>
          <div className="flex items-center gap-1">
            <input type="color" className="h-9 w-10 rounded border border-gray-300"
              value={color || '#4f46e5'} onChange={(e) => setColor(e.target.value)} />
            {color ? (
              <Button size="sm" variant="ghost" onClick={() => setColor('')}>inherit</Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Palette */}
      <div className="flex flex-wrap gap-2">
        {typeList.map((t: EventTableType) => (
          <Button key={t.eventTablesId} size="sm" draggable
            onDragStart={(e) => startDrag(e, { drag: 'new-table', typeId: t.eventTablesId })}
            variant={isSelected({ kind: 'table', typeId: t.eventTablesId, label: t.label }) ? 'default' : 'outline'}
            onClick={() => setTool({ kind: 'table', typeId: t.eventTablesId, label: t.label })}>
            {t.label} · {t.rowSpan}×{t.colSpan} · {centsToUSD(t.priceCents)}
          </Button>
        ))}
        {typeList.length === 0 ? <p className="text-sm text-gray-500">Add table types above to place them.</p> : null}
        {OBJECT_TYPES.map((o) => (
          <Button key={o} size="sm" draggable
            onDragStart={(e) => startDrag(e, { drag: 'new-object', objectType: o })}
            variant={isSelected({ kind: 'object', objectType: o }) ? 'default' : 'outline'}
            onClick={() => setTool({ kind: 'object', objectType: o })}>
            {OBJECT_GLYPH[o]} {o}
          </Button>
        ))}
        <Button size="sm" variant={tool?.kind === 'erase' ? 'destructive' : 'outline'} onClick={() => setTool({ kind: 'erase' })}>
          Erase
        </Button>
      </div>

      {/* Grid */}
      <div className="overflow-auto">
        <div className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${Math.max(cols, 1)}, ${CELL}rem)`,
            gridTemplateRows: `repeat(${Math.max(rows, 1)}, ${CELL}rem)`,
          }}>
          {emptyCells.map(({ r, c }) => (
            <button key={`e${r}:${c}`} type="button" title={`${r},${c}`} onClick={() => clickCell(r, c)}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(r, c, e)}
              style={{ gridRow: `${r + 1}`, gridColumn: `${c + 1}` }}
              className="h-full w-full rounded border border-gray-200 bg-gray-50 hover:bg-gray-200" />
          ))}
          {tables.map((t, i) => {
            const type = typeById.get(t.eventTablesId);
            const fill = t.colorOverride || type?.color || '#4f46e5';
            const sh = t.shapeOverride || type?.shape || 'Rectangle';
            return (
              <button key={`t${i}`} type="button" title={`${t.label} · ${sh} (drag to move, click to remove)`}
                draggable onDragStart={(e) => startDrag(e, { drag: 'move-table', idx: i })}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(t.gridRow, t.gridCol, e)}
                onClick={() => clickCell(t.gridRow, t.gridCol)}
                style={{
                  gridRow: `${t.gridRow + 1} / span ${t.rowSpan}`,
                  gridColumn: `${t.gridCol + 1} / span ${t.colSpan}`,
                  backgroundColor: fill,
                }}
                className={`flex h-full w-full cursor-move items-center justify-center border border-black/10 text-xs font-medium text-white ${shapeClass(sh)}`}>
                {t.label}
              </button>
            );
          })}
          {objects.map((o, i) => (
            <button key={`o${i}`} type="button" title={`${o.objectType} (drag to move, click to remove)`}
              draggable onDragStart={(e) => startDrag(e, { drag: 'move-object', idx: i })}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(o.gridRow, o.gridCol, e)}
              onClick={() => clickCell(o.gridRow, o.gridCol)}
              style={{ gridRow: `${o.gridRow + 1}`, gridColumn: `${o.gridCol + 1}` }}
              className="flex h-full w-full cursor-move items-center justify-center rounded border border-emerald-700 bg-emerald-600 text-xs text-white">
              {OBJECT_GLYPH[o.objectType] ?? o.objectType[0]}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Pick a table type (with span/shape/color) or an object, then click a cell. Multi-cell tables reserve their
        whole footprint — overlaps are blocked. Click a placed item to remove.{dirty ? ' · Unsaved changes' : ''}
      </p>
    </div>
  );
}
