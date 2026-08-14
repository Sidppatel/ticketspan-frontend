import type { DragEvent } from 'react';
import { centsToUSD } from '@/shared/lib/format';
import type { EventTableType } from '@/shared/proto/booking';
import type { DragItem } from './FloorPlanBuilder';

interface FloorPlanPaletteProps {
  typeList: EventTableType[];
  typeById: Map<string, EventTableType>;
  lockedTypeIds: Set<string>;
  pending: DragItem | null;
  objectTypes: string[];
  objectGlyphs: Record<string, string>;
  setNotice: (notice: string | null) => void;
  setPending: (item: DragItem | null) => void;
  startPaletteDrag: (e: DragEvent, item: DragItem) => void;
  deleteType: (typeId: string, label: string) => void;
}

export function FloorPlanPalette({
  typeList,
  lockedTypeIds,
  pending,
  objectTypes,
  objectGlyphs,
  setNotice,
  setPending,
  startPaletteDrag,
  deleteType,
}: FloorPlanPaletteProps) {
  return (
    <div className="w-48 shrink-0 space-y-3 rounded-md border bg-card p-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tables</p>
        <div className="space-y-1.5">
          {typeList.map((t: EventTableType) => (
            <div key={t.eventTablesId} className="flex items-stretch overflow-hidden rounded-md border border-input">
              <button
                type="button"
                draggable
                onDragStart={(e) => startPaletteDrag(e, { drag: 'new-table', typeId: t.eventTablesId })}
                onClick={() => { setNotice(null); setPending({ drag: 'new-table', typeId: t.eventTablesId }); }}
                className={`flex-1 cursor-grab px-2 py-1.5 text-left text-xs hover:bg-muted ${pending?.drag === 'new-table' && pending.typeId === t.eventTablesId ? 'bg-muted ring-2 ring-inset ring-ink' : ''}`}
              >
                <span className="block font-medium">{t.label}</span>
                <span className="block text-muted-foreground">{t.defaultWidth}×{t.defaultHeight} · {centsToUSD(t.priceCents)}</span>
              </button>
              <button
                type="button"
                disabled={lockedTypeIds.has(t.eventTablesId)}
                title={lockedTypeIds.has(t.eventTablesId)
                  ? 'Locked — this type has sold or held tables and can’t be removed'
                  : 'Delete table type and all its placed tables'}
                onClick={() => deleteType(t.eventTablesId, t.label)}
                className="border-l border-input px-2 text-sm text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
              >
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
          {objectTypes.map((o) => (
            <button
              key={o}
              type="button"
              draggable
              onDragStart={(e) => startPaletteDrag(e, { drag: 'new-object', objectType: o })}
              onClick={() => { setNotice(null); setPending({ drag: 'new-object', objectType: o }); }}
              className={`block w-full cursor-grab rounded-md border border-input px-2 py-1.5 text-left text-xs hover:bg-muted ${pending?.drag === 'new-object' && pending.objectType === o ? 'bg-muted ring-2 ring-inset ring-ink' : ''}`}
            >
              {objectGlyphs[o]} {o}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Tap an item then tap the canvas to place it (or drag on desktop). Ctrl+scroll zooms, drag empty space pans. Delete key removes selection.
      </p>
    </div>
  );
}
