import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent, RefObject } from 'react';
import type { EventTableType } from '@/shared/proto/booking';
import type { PlacedTable, PlacedObject, DragItem } from './FloorPlanBuilder';

interface FloorPlanViewportProps {
  viewportRef: RefObject<HTMLDivElement | null>;
  pending: DragItem | null;
  onCanvasDrop: (e: React.DragEvent) => void;
  onWheel: (e: ReactWheelEvent) => void;
  onViewportPointerDown: (e: ReactPointerEvent) => void;
  onViewportPointerMove: (e: ReactPointerEvent) => void;
  onViewportPointerUp: (e: ReactPointerEvent) => void;
  CANVAS_W: number;
  CANVAS_H: number;
  pan: { x: number; y: number };
  zoom: number;
  SNAP: number;
  dragBox: { x: number; y: number; w: number; h: number } | null;
  tables: PlacedTable[];
  objects: PlacedObject[];
  typeById: Map<string, EventTableType>;
  isTableLocked: (t: PlacedTable) => boolean;
  onItemPointerDown: (e: ReactPointerEvent, kind: 'table' | 'object', mode: 'move' | 'resize', idx: number) => void;
  onItemPointerMove: (e: ReactPointerEvent) => void;
  onItemPointerUp: (e: ReactPointerEvent, kind: 'table' | 'object', idx: number) => void;
  selected: string | null;
  shapeClass: (shape: string) => string;
  OBJECT_GLYPH: Record<string, string>;
}

export function FloorPlanViewport({
  viewportRef,
  pending,
  onCanvasDrop,
  onWheel,
  onViewportPointerDown,
  onViewportPointerMove,
  onViewportPointerUp,
  CANVAS_W,
  CANVAS_H,
  pan,
  zoom,
  SNAP,
  dragBox,
  tables,
  objects,
  typeById,
  isTableLocked,
  onItemPointerDown,
  onItemPointerMove,
  onItemPointerUp,
  selected,
  shapeClass,
  OBJECT_GLYPH,
}: FloorPlanViewportProps) {
  return (
    <div
      ref={viewportRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onCanvasDrop}
      onWheel={onWheel}
      onPointerDown={onViewportPointerDown}
      onPointerMove={onViewportPointerMove}
      onPointerUp={onViewportPointerUp}
      className={`relative h-[560px] flex-1 overflow-hidden rounded-md border bg-muted ${pending ? 'cursor-crosshair' : 'cursor-grab'}`}
    >
      <div
        data-canvas="1"
        className="absolute rounded-sm bg-background shadow-sm"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          backgroundImage: 'radial-gradient(circle, color-mix(in srgb, var(--ink) 8%, transparent) 1px, transparent 1px)',
          backgroundSize: `${SNAP * 4}px ${SNAP * 4}px`,
        }}
      >
        {dragBox ? (
          <>
            {[
              { pos: dragBox.x, center: false },
              { pos: dragBox.x + dragBox.w / 2, center: true },
              { pos: dragBox.x + dragBox.w, center: false },
            ].map((g, i) => (
              <div
                key={`gv${i}`}
                className="pointer-events-none absolute top-0 z-10 h-full w-px"
                style={{ left: g.pos, backgroundColor: g.center ? '#f87171' : '#93c5fd' }}
              />
            ))}
            {[
              { pos: dragBox.y, center: false },
              { pos: dragBox.y + dragBox.h / 2, center: true },
              { pos: dragBox.y + dragBox.h, center: false },
            ].map((g, i) => (
              <div
                key={`gh${i}`}
                className="pointer-events-none absolute left-0 z-10 h-px w-full"
                style={{ top: g.pos, backgroundColor: g.center ? '#f87171' : '#93c5fd' }}
              />
            ))}
          </>
        ) : null}
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
              title={
                locked
                  ? `${t.label} · ${t.status} — sold/held, can’t be moved or removed`
                  : `${t.label} · ${sh}`
              }
              style={{
                position: 'absolute',
                left: t.posX,
                top: t.posY,
                width: t.width,
                height: t.height,
                backgroundColor: locked ? 'var(--ink-faint)' : fill,
                touchAction: 'none',
              }}
              className={`flex select-none items-center justify-center border text-xs font-medium text-white transition-shadow ${shapeClass(
                sh,
              )} ${locked ? 'cursor-not-allowed opacity-70' : 'cursor-move hover:shadow-md'} ${
                selected === `t${i}` ? 'border-ink ring-2 ring-ink' : 'border-ink/10'
              }`}
            >
              <span className="pointer-events-none truncate px-1">
                {locked ? <span aria-hidden>🔒 </span> : null}
                {t.label}
              </span>
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
              position: 'absolute',
              left: o.posX,
              top: o.posY,
              width: o.width,
              height: o.height,
              backgroundColor: o.color,
              touchAction: 'none',
            }}
            className={`flex cursor-move select-none items-center justify-center rounded text-xs text-white transition-shadow hover:shadow-md ${
              selected === `o${i}` ? 'border-2 border-black ring-2 ring-black' : 'border border-black/20'
            }`}
          >
            <span className="pointer-events-none">
              {OBJECT_GLYPH[o.objectType] ?? o.objectType[0]} {o.objectType}
            </span>
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
  );
}
