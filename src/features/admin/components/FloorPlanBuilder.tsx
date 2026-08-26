import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { getEventLayout, saveEventLayout } from '@/features/admin/services/layoutService';
import { listEventTableTypes, deleteEventTable } from '@/features/admin/services/eventAdminService';
import { rpcErrorMessage } from '@/shared/session';
import type { Table, LayoutObject, EventTableType } from '@/shared/proto/booking';
import { FloorPlanPalette } from './FloorPlanPalette';
import { FloorPlanInspector } from './FloorPlanInspector';
import { FloorPlanViewport } from './FloorPlanViewport';
import { FloorPlanToolbar } from './FloorPlanToolbar';
import { useFloorPlanZoomPan } from '@/features/admin/hooks/useFloorPlanZoomPan';
import { useAppSettingsStore } from '@/shared/lib/appSettingsStore';

export type PlacedTable = {
  tablesId: string;
  eventTablesId: string;
  label: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  shapeOverride: string;
  colorOverride: string;
  status: string;
};
export type PlacedObject = {
  layoutObjectsId: string;
  objectType: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  color: string;
};
export type DragItem = { drag: 'new-table'; typeId: string } | { drag: 'new-object'; objectType: string };
type Scene = { tables: PlacedTable[]; objects: PlacedObject[] };

const OBJECT_TYPES = ['Entry', 'Exit', 'Stage'];
const OBJECT_GLYPH: Record<string, string> = { Entry: '→', Exit: '←', Stage: '▭' };
const getFloorplanDefaultSize = (): number => useAppSettingsStore.getState().floorplanDefaultSize;
const getFloorplanDefaultColor = (): string => useAppSettingsStore.getState().floorplanDefaultColor;
const CANVAS_W = 1000;
const CANVAS_H = 640;
const SNAP = 5;
const MIN_SIZE = 24;
const GUIDE_TOL = 6;

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
      return 'rounded-md';
  }
}

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
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragBox, setDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [pending, setPending] = useState<{ drag: 'new-table'; typeId: string } | { drag: 'new-object'; objectType: string } | null>(null);

  const historyRef = useRef<Scene[]>([]);
  const futureRef = useRef<Scene[]>([]);
  const [historySize, setHistorySize] = useState(0);
  const [futureSize, setFutureSize] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const sceneRef = useRef<Scene>({ tables: [], objects: [] });
  useEffect(() => {
    sceneRef.current = { tables, objects };
  }, [tables, objects]);

  const draftKey = `floorplan-draft:${eventsId}`;

  function pushHistory() {
    historyRef.current.push({
      tables: sceneRef.current.tables.map((t) => ({ ...t })),
      objects: sceneRef.current.objects.map((o) => ({ ...o })),
    });
    if (historyRef.current.length > 50) historyRef.current.shift();
    futureRef.current = [];
    setHistorySize(historyRef.current.length);
    setFutureSize(0);
  }

  function undo() {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push(sceneRef.current);
    setTables(prev.tables);
    setObjects(prev.objects);
    setSelected(null);
    setDirty(true);
    setHistorySize(historyRef.current.length);
    setFutureSize(futureRef.current.length);
  }

  function redo() {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(sceneRef.current);
    setTables(next.tables);
    setObjects(next.objects);
    setSelected(null);
    setDirty(true);
    setHistorySize(historyRef.current.length);
    setFutureSize(futureRef.current.length);
  }

  const [prevLayoutData, setPrevLayoutData] = useState<unknown>(null);
  if (layout.data && layout.data !== prevLayoutData) {
    setPrevLayoutData(layout.data);
    const draftRaw = window.localStorage.getItem(draftKey);
    const draft = draftRaw ? (JSON.parse(draftRaw) as Scene) : null;
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
          width: t.width || getFloorplanDefaultSize(),
          height: t.height || getFloorplanDefaultSize(),
          shapeOverride: t.shapeOverride || '',
          colorOverride: t.colorOverride || '',
          status: t.status || 'Available',
        })),
      );
      setObjects(
        layout.data.objects.map((o: LayoutObject) => ({
          layoutObjectsId: o.layoutObjectsId,
          objectType: o.objectType,
          posX: o.posX,
          posY: o.posY,
          width: o.width || getFloorplanDefaultSize(),
          height: o.height || getFloorplanDefaultSize(),
          color: o.color || getFloorplanDefaultColor(),
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

  const lockedTypeIds = useMemo(() => {
    const s = new Set<string>();
    (layout.data?.tables ?? []).forEach((t) => {
      if (t.status && t.status !== 'Available') s.add(t.eventTablesId);
    });
    return s;
  }, [layout.data]);
  const lockedTableIds = useMemo(() => {
    const s = new Set<string>();
    (layout.data?.tables ?? []).forEach((t) => {
      if (t.status && t.status !== 'Available') s.add(t.tablesId);
    });
    return s;
  }, [layout.data]);

  const selectedTableIdx = selected?.startsWith('t') ? Number(selected.slice(1)) : -1;
  const selectedObjectIdx = selected?.startsWith('o') ? Number(selected.slice(1)) : -1;
  const selTable = tables[selectedTableIdx];
  const selObject = objects[selectedObjectIdx];

  function nextTableLabel(typeId: string) {
    const typeName = typeById.get(typeId)?.label || 'Table';
    const used = new Set(tables.filter((t) => t.eventTablesId === typeId).map((t) => t.label));
    let n = 1;
    while (used.has(`${typeName} - ${n}`)) n += 1;
    return `${typeName} - ${n}`;
  }

  function canvasPoint(clientX: number, clientY: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  }

  function collides(
    x: number, y: number, w: number, h: number,
    kind: 'table' | 'object', ignoreIdx: number,
  ): boolean {
    const hit = (px: number, py: number, pw: number, ph: number) =>
      x < px + pw && x + w > px && y < py + ph && y + h > py;
    const hitTable = tables.some((t, i) => !(kind === 'table' && i === ignoreIdx) && hit(t.posX, t.posY, t.width, t.height));
    const hitObject = objects.some((o, i) => !(kind === 'object' && i === ignoreIdx) && hit(o.posX, o.posY, o.width, o.height));
    return hitTable || hitObject;
  }

  function alignToGuides(x: number, y: number, w: number, h: number, kind: 'table' | 'object', ignoreIdx: number): { x: number; y: number } {
    const vCands = [CANVAS_W / 2], hCands = [CANVAS_H / 2];
    const addCands = (px: number, py: number, pw: number, ph: number) => { vCands.push(px, px + pw / 2, px + pw); hCands.push(py, py + ph / 2, py + ph); };
    tables.forEach((t, i) => { if (!(kind === 'table' && i === ignoreIdx)) addCands(t.posX, t.posY, t.width, t.height); });
    objects.forEach((o, i) => { if (!(kind === 'object' && i === ignoreIdx)) addCands(o.posX, o.posY, o.width, o.height); });
    let nx = snap(x), ny = snap(y), bestV = GUIDE_TOL + 1, bestH = GUIDE_TOL + 1;
    vCands.forEach((c) => [0, w / 2, w].forEach((edge) => { const d = Math.abs(x + edge - c); if (d < bestV) { bestV = d; nx = c - edge; } }));
    hCands.forEach((c) => [0, h / 2, h].forEach((edge) => { const d = Math.abs(y + edge - c); if (d < bestH) { bestH = d; ny = c - edge; } }));
    return { x: nx, y: ny };
  }

  function placeTable(typeId: string, cx: number, cy: number) {
    const t = typeById.get(typeId);
    const defSize = getFloorplanDefaultSize();
    const w = Math.max(MIN_SIZE, t?.defaultWidth || defSize);
    const h = Math.max(MIN_SIZE, t?.defaultHeight || defSize);
    const px = clamp(snap(cx - w / 2), 0, CANVAS_W - w);
    const py = clamp(snap(cy - h / 2), 0, CANVAS_H - h);
    if (collides(px, py, w, h, 'table', -1)) {
      setNotice("No room here — items can't overlap");
      return;
    }
    pushHistory();
    setTables((prev) => [
      ...prev,
      {
        tablesId: '', eventTablesId: typeId, label: nextTableLabel(typeId),
        posX: px, posY: py, width: w, height: h, shapeOverride: '', colorOverride: '', status: 'Available',
      },
    ]);
    setSelected(`t${tables.length}`);
    setDirty(true);
  }

  function placeObject(objectType: string, cx: number, cy: number) {
    const defSize = getFloorplanDefaultSize();
    const px = clamp(snap(cx - defSize / 2), 0, CANVAS_W - defSize);
    const py = clamp(snap(cy - defSize / 2), 0, CANVAS_H - defSize);
    if (collides(px, py, defSize, defSize, 'object', -1)) {
      setNotice("No room here — items can't overlap");
      return;
    }
    pushHistory();
    setObjects((prev) => [
      ...prev,
      {
        layoutObjectsId: '', objectType,
        posX: px, posY: py,
        width: defSize, height: defSize,
        color: getFloorplanDefaultColor(),
      },
    ]);
    setSelected(`o${objects.length}`);
    setDirty(true);
  }

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

  function isTableLocked(t: PlacedTable) {
    return (!!t.status && t.status !== 'Available') || (!!t.tablesId && lockedTableIds.has(t.tablesId));
  }

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
    if (kind === 'table' && isTableLocked(item as PlacedTable)) {
      setNotice(`"${(item as PlacedTable).label}" is sold/held — sold/held tables can't be moved or removed`);
      return;
    }
    (e.target as Element).setPointerCapture(e.pointerId);
    pushHistory();
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
    const dx = (e.clientX - d.startX) / zoom;
    const dy = (e.clientY - d.startY) / zoom;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;

    const list = d.kind === 'table' ? tables : objects;
    const base = list[d.idx];
    if (!base) return;
    let nx = base.posX, ny = base.posY, nw = base.width, nh = base.height;
    if (d.mode === 'move') {
      const aligned = alignToGuides(d.origX + dx, d.origY + dy, base.width, base.height, d.kind, d.idx);
      nx = clamp(aligned.x, 0, CANVAS_W - base.width);
      ny = clamp(aligned.y, 0, CANVAS_H - base.height);
      setDragBox({ x: nx, y: ny, w: base.width, h: base.height });
    } else {
      nw = clamp(snap(d.origW + dx), MIN_SIZE, CANVAS_W - base.posX);
      nh = clamp(snap(d.origH + dy), MIN_SIZE, CANVAS_H - base.posY);
    }
    if (collides(nx, ny, nw, nh, d.kind, d.idx)) {
      setNotice("Items can't overlap");
      return;
    }
    if (d.kind === 'table') {
      setTables((prev) => prev.map((x, i) => (i === d.idx ? { ...x, posX: nx, posY: ny, width: nw, height: nh } : x)));
    } else {
      setObjects((prev) => prev.map((x, i) => (i === d.idx ? { ...x, posX: nx, posY: ny, width: nw, height: nh } : x)));
    }
    setDirty(true);
  }

  function onItemPointerUp(e: ReactPointerEvent, kind: 'table' | 'object', idx: number) {
    const d = dragRef.current;
    dragRef.current = null;
    setDragBox(null);
    if (!d) return;
    if (!d.moved) {
      historyRef.current.pop();
      setHistorySize(historyRef.current.length);
      setSelected(`${kind === 'table' ? 't' : 'o'}${idx}`);
    }
    void e;
  }

  function updateSelectedTable(patch: Partial<PlacedTable>, withHistory = true) {
    if (selectedTableIdx < 0) return;
    if (withHistory) pushHistory();
    setTables((prev) => prev.map((x, i) => (i === selectedTableIdx ? { ...x, ...patch } : x)));
    setDirty(true);
  }

  function updateSelectedObject(patch: Partial<PlacedObject>, withHistory = true) {
    if (selectedObjectIdx < 0) return;
    if (withHistory) pushHistory();
    setObjects((prev) => prev.map((x, i) => (i === selectedObjectIdx ? { ...x, ...patch } : x)));
    setDirty(true);
  }

  function deleteSelected() {
    const cur = sceneRef.current;
    if (selectedTableIdx >= 0 && cur.tables[selectedTableIdx]) {
      if (isTableLocked(cur.tables[selectedTableIdx])) return;
      pushHistory();
      setTables((prev) => prev.filter((_, i) => i !== selectedTableIdx));
    } else if (selectedObjectIdx >= 0 && cur.objects[selectedObjectIdx]) {
      pushHistory();
      setObjects((prev) => prev.filter((_, i) => i !== selectedObjectIdx));
    } else {
      return;
    }
    setSelected(null);
    setDirty(true);
  }

  const {
    zoom,
    pan,
    zoomAt,
    fitToScreen,
    onWheel,
    onViewportPointerDown,
    onViewportPointerMove,
    onViewportPointerUp,
  } = useFloorPlanZoomPan({
    viewportRef,
    CANVAS_W,
    CANVAS_H,
    undo,
    redo,
    deleteSelected,
    setSelected,
    pending,
    canvasPoint,
    placeTable,
    placeObject,
    setPending,
  });

  async function deleteType(typeId: string, label: string) {
    if (lockedTypeIds.has(typeId)) {
      setNotice(`"${label}" can't be removed — it has sold or held tables`);
      return;
    }
    if (!window.confirm(`Delete table type "${label}" and all its placed tables?`)) return;
    setNotice(null);
    try {
      await deleteEventTable(typeId);
      pushHistory();
      setTables((prev) => prev.filter((t) => t.eventTablesId !== typeId));
      setSelected(null);
      types.reload();
      layout.reload();
      onTypesChanged?.();
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
    <div className="space-y-2">
      <FloorPlanToolbar
        undo={undo}
        redo={redo}
        historySize={historySize}
        futureSize={futureSize}
        zoom={zoom}
        zoomAt={zoomAt}
        fitToScreen={fitToScreen}
        dirty={dirty}
        saving={saving}
        save={save}
        notice={notice}
        pending={pending}
        typeById={typeById}
        setPending={setPending}
      />

      <div className="flex gap-2">
        <FloorPlanPalette
          typeList={typeList}
          typeById={typeById}
          lockedTypeIds={lockedTypeIds}
          pending={pending}
          objectTypes={OBJECT_TYPES}
          objectGlyphs={OBJECT_GLYPH}
          setNotice={setNotice}
          setPending={setPending}
          startPaletteDrag={startPaletteDrag}
          deleteType={deleteType}
        />

        <FloorPlanViewport
          viewportRef={viewportRef}
          pending={pending}
          onCanvasDrop={onCanvasDrop}
          onWheel={onWheel}
          onViewportPointerDown={onViewportPointerDown}
          onViewportPointerMove={onViewportPointerMove}
          onViewportPointerUp={onViewportPointerUp}
          CANVAS_W={CANVAS_W}
          CANVAS_H={CANVAS_H}
          pan={pan}
          zoom={zoom}
          SNAP={SNAP}
          dragBox={dragBox}
          tables={tables}
          objects={objects}
          typeById={typeById}
          isTableLocked={isTableLocked}
          onItemPointerDown={onItemPointerDown}
          onItemPointerMove={onItemPointerMove}
          onItemPointerUp={onItemPointerUp}
          selected={selected}
          shapeClass={shapeClass}
          OBJECT_GLYPH={OBJECT_GLYPH}
        />

        <FloorPlanInspector
          selTable={selTable}
          selObject={selObject}
          isTableLocked={isTableLocked}
          updateSelectedTable={updateSelectedTable}
          updateSelectedObject={updateSelectedObject}
          deleteSelected={deleteSelected}
        />
      </div>
    </div>
  );
}
