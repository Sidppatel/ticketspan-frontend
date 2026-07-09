import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { getEventLayout, saveEventLayout } from '@/features/admin/services/layoutService';
import { listEventTableTypes, deleteEventTable } from '@/features/admin/services/eventAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import type { Table, LayoutObject, EventTableType } from '@/shared/proto/booking';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

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
  status: string;
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
type Scene = { tables: PlacedTable[]; objects: PlacedObject[] };

const OBJECT_TYPES = ['Entry', 'Exit', 'Stage'];
const OBJECT_GLYPH: Record<string, string> = { Entry: '→', Exit: '←', Stage: '▭' };
const OBJECT_DEFAULT_COLOR: Record<string, string> = { Entry: '#059669', Exit: '#059669', Stage: '#424242' };
const SHAPES = ['Rectangle', 'Square', 'Round', 'Cocktail'];
const CANVAS_W = 1000;
const CANVAS_H = 640;
const SNAP = 5;
const MIN_SIZE = 24;
const DEFAULT_SIZE = 80;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;

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
type Pan = { startX: number; startY: number; origX: number; origY: number };

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const historyRef = useRef<Scene[]>([]);
  const futureRef = useRef<Scene[]>([]);
  const [historySize, setHistorySize] = useState(0);
  const [futureSize, setFutureSize] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const panRef = useRef<Pan | null>(null);
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
          width: t.width || DEFAULT_SIZE,
          height: t.height || DEFAULT_SIZE,
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

  function placeTable(typeId: string, cx: number, cy: number) {
    const t = typeById.get(typeId);
    const w = Math.max(MIN_SIZE, t?.defaultWidth || DEFAULT_SIZE);
    const h = Math.max(MIN_SIZE, t?.defaultHeight || DEFAULT_SIZE);
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
    const px = clamp(snap(cx - DEFAULT_SIZE / 2), 0, CANVAS_W - DEFAULT_SIZE);
    const py = clamp(snap(cy - DEFAULT_SIZE / 2), 0, CANVAS_H - DEFAULT_SIZE);
    if (collides(px, py, DEFAULT_SIZE, DEFAULT_SIZE, 'object', -1)) {
      setNotice("No room here — items can't overlap");
      return;
    }
    pushHistory();
    setObjects((prev) => [
      ...prev,
      {
        layoutObjectsId: '', objectType,
        posX: px, posY: py,
        width: DEFAULT_SIZE, height: DEFAULT_SIZE,
        color: OBJECT_DEFAULT_COLOR[objectType] || '#059669',
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
      nx = clamp(snap(d.origX + dx), 0, CANVAS_W - base.width);
      ny = clamp(snap(d.origY + dy), 0, CANVAS_H - base.height);
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

  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  const keyHandler = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      redo();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteSelected();
    } else if (e.key === 'Escape') {
      setSelected(null);
    }
  };
  useEffect(() => {
    keyHandlerRef.current = keyHandler;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function zoomAt(nextZoom: number, cx?: number, cy?: number) {
    const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect && cx !== undefined && cy !== undefined) {
      const px = cx - rect.left;
      const py = cy - rect.top;
      setPan((p) => ({ x: px - ((px - p.x) / zoom) * z, y: py - ((py - p.y) / zoom) * z }));
    }
    setZoom(z);
  }

  function fitToScreen() {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const z = clamp(Math.min(rect.width / CANVAS_W, rect.height / CANVAS_H) * 0.95, MIN_ZOOM, MAX_ZOOM);
    setZoom(z);
    setPan({ x: (rect.width - CANVAS_W * z) / 2, y: (rect.height - CANVAS_H * z) / 2 });
  }

  function onWheel(e: ReactWheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    zoomAt(zoom * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX, e.clientY);
  }

  function onViewportPointerDown(e: ReactPointerEvent) {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).dataset.canvas !== '1') return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    panRef.current = { startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y };
    setSelected(null);
  }

  function onViewportPointerMove(e: ReactPointerEvent) {
    const p = panRef.current;
    if (!p) return;
    setPan({ x: p.origX + (e.clientX - p.startX), y: p.origY + (e.clientY - p.startY) });
  }

  function onViewportPointerUp() {
    panRef.current = null;
  }

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
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card px-3 py-2">
        <Button size="sm" variant="outline" onClick={undo} disabled={historySize === 0} title="Undo (Ctrl+Z)">↺ Undo</Button>
        <Button size="sm" variant="outline" onClick={redo} disabled={futureSize === 0} title="Redo (Ctrl+Y)">↻ Redo</Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button size="sm" variant="outline" onClick={() => zoomAt(zoom * 1.2)} title="Zoom in">＋</Button>
        <Button size="sm" variant="outline" onClick={() => zoomAt(zoom / 1.2)} title="Zoom out">－</Button>
        <Button size="sm" variant="outline" onClick={fitToScreen} title="Fit to screen">Fit</Button>
        <span className="text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <span className="flex-1" />
        {dirty ? <span className="text-xs text-amber-foreground">Unsaved changes</span> : null}
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save layout' : 'Saved'}
        </Button>
      </div>

      {notice ? <p className="text-sm text-amber-foreground">{notice}</p> : null}

      <div className="flex gap-2">
        <div className="w-48 shrink-0 space-y-3 rounded-md border bg-card p-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tables</p>
            <div className="space-y-1.5">
              {typeList.map((t: EventTableType) => (
                <div key={t.eventTablesId}
                  className="flex items-stretch overflow-hidden rounded-md border border-input">
                  <button type="button" draggable
                    onDragStart={(e) => startPaletteDrag(e, { drag: 'new-table', typeId: t.eventTablesId })}
                    className="flex-1 cursor-grab px-2 py-1.5 text-left text-xs hover:bg-muted">
                    <span className="block font-medium">{t.label}</span>
                    <span className="block text-muted-foreground">{t.defaultWidth}×{t.defaultHeight} · {centsToUSD(t.priceCents)}</span>
                  </button>
                  <button type="button" disabled={lockedTypeIds.has(t.eventTablesId)}
                    title={lockedTypeIds.has(t.eventTablesId)
                      ? 'Locked — this type has sold or held tables and can’t be removed'
                      : 'Delete table type and all its placed tables'}
                    onClick={() => deleteType(t.eventTablesId, t.label)}
                    className="border-l border-input px-2 text-sm text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent">
                    {lockedTypeIds.has(t.eventTablesId) ? '🔒' : '×'}
                  </button>
                </div>
              ))}
              {typeList.length === 0 ? (
                <p className="text-xs text-muted-foreground">Add table types above to place them.</p>
              ) : null}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objects</p>
            <div className="space-y-1.5">
              {OBJECT_TYPES.map((o) => (
                <button key={o} type="button" draggable
                  onDragStart={(e) => startPaletteDrag(e, { drag: 'new-object', objectType: o })}
                  className="block w-full cursor-grab rounded-md border border-input px-2 py-1.5 text-left text-xs hover:bg-muted">
                  {OBJECT_GLYPH[o]} {o}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Drag onto canvas. Ctrl+scroll zooms, drag empty space pans. Delete key removes selection.
          </p>
        </div>

        <div
          ref={viewportRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onCanvasDrop}
          onWheel={onWheel}
          onPointerDown={onViewportPointerDown}
          onPointerMove={onViewportPointerMove}
          onPointerUp={onViewportPointerUp}
          className="relative h-[560px] flex-1 cursor-grab overflow-hidden rounded-md border bg-muted"
        >
          <div
            data-canvas="1"
            className="absolute rounded-sm bg-background shadow-sm"
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
              backgroundSize: `${SNAP * 4}px ${SNAP * 4}px`,
            }}
          >
            {tables.map((t, i) => {
              const type = typeById.get(t.eventTablesId);
              const fill = t.colorOverride || type?.color || '#4f46e5';
              const sh = t.shapeOverride || type?.shape || 'Rectangle';
              const locked = isTableLocked(t);
              return (
                <div
                  key={`t${i}`}
                  onPointerDown={(e) => onItemPointerDown(e, 'table', 'move', i)}
                  onPointerMove={onItemPointerMove}
                  onPointerUp={(e) => onItemPointerUp(e, 'table', i)}
                  title={locked
                    ? `${t.label} · ${t.status} — sold/held, can’t be moved or removed`
                    : `${t.label} · ${sh}`}
                  style={{
                    position: 'absolute', left: t.posX, top: t.posY, width: t.width, height: t.height,
                    backgroundColor: locked ? '#9ca3af' : fill, touchAction: 'none',
                  }}
                  className={`flex select-none items-center justify-center border text-xs font-medium text-white transition-shadow ${shapeClass(sh)} ${
                    locked ? 'cursor-not-allowed opacity-70' : 'cursor-move hover:shadow-md'
                  } ${selected === `t${i}` ? 'border-black ring-2 ring-black' : 'border-black/10'}`}
                >
                  <span className="pointer-events-none truncate px-1">
                    {locked ? <span aria-hidden>🔒 </span> : null}
                    {t.label}
                  </span>
                  {locked ? null : (
                    <span
                      onPointerDown={(e) => onItemPointerDown(e, 'table', 'resize', i)}
                      onPointerMove={onItemPointerMove}
                      onPointerUp={(e) => onItemPointerUp(e, 'table', i)}
                      className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize rounded-sm border border-white bg-black/40"
                    />
                  )}
                </div>
              );
            })}
            {objects.map((o, i) => (
              <div
                key={`o${i}`}
                onPointerDown={(e) => onItemPointerDown(e, 'object', 'move', i)}
                onPointerMove={onItemPointerMove}
                onPointerUp={(e) => onItemPointerUp(e, 'object', i)}
                title={o.objectType}
                style={{
                  position: 'absolute', left: o.posX, top: o.posY, width: o.width, height: o.height,
                  backgroundColor: o.color, touchAction: 'none',
                }}
                className={`flex cursor-move select-none items-center justify-center rounded text-xs text-white transition-shadow hover:shadow-md ${
                  selected === `o${i}` ? 'border-2 border-black ring-2 ring-black' : 'border border-black/20'
                }`}
              >
                <span className="pointer-events-none">{OBJECT_GLYPH[o.objectType] ?? o.objectType[0]} {o.objectType}</span>
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

        {selTable || selObject ? (
          <div className="w-56 shrink-0 space-y-3 rounded-md border bg-card p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {selTable ? 'Table' : selObject?.objectType}
            </p>
            {selTable ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={selTable.label}
                    disabled={isTableLocked(selTable)}
                    onChange={(e) => updateSelectedTable({ label: e.target.value }, false)}
                    className="h-8 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {selTable.width}×{selTable.height} at ({selTable.posX}, {selTable.posY})
                </p>
                {isTableLocked(selTable) ? (
                  <p className="text-xs text-amber-foreground">Sold/held — locked.</p>
                ) : (
                  <Button size="sm" variant="destructive" onClick={deleteSelected} className="w-full">
                    Delete table
                  </Button>
                )}
              </>
            ) : selObject ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <input
                    type="color"
                    value={selObject.color}
                    onChange={(e) => updateSelectedObject({ color: e.target.value })}
                    className="h-8 w-full cursor-pointer rounded-md border border-input"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {selObject.width}×{selObject.height} at ({selObject.posX}, {selObject.posY})
                </p>
                <Button size="sm" variant="destructive" onClick={deleteSelected} className="w-full">
                  Delete object
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
