import { Button } from '@/shared/ui/button';
import type { EventTableType } from '@/shared/proto/booking';
import type { DragItem } from './FloorPlanBuilder';

interface FloorPlanToolbarProps {
  undo: () => void;
  redo: () => void;
  historySize: number;
  futureSize: number;
  zoom: number;
  zoomAt: (z: number) => void;
  fitToScreen: () => void;
  dirty: boolean;
  saving: boolean;
  save: () => void;
  notice: string | null;
  pending: DragItem | null;
  typeById: Map<string, EventTableType>;
  setPending: (pending: DragItem | null) => void;
}

export function FloorPlanToolbar({
  undo,
  redo,
  historySize,
  futureSize,
  zoom,
  zoomAt,
  fitToScreen,
  dirty,
  saving,
  save,
  notice,
  pending,
  typeById,
  setPending,
}: FloorPlanToolbarProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card px-3 py-2">
        <Button size="sm" variant="outline" onClick={undo} disabled={historySize === 0} title="Undo (Ctrl+Z)">
          ↺ Undo
        </Button>
        <Button size="sm" variant="outline" onClick={redo} disabled={futureSize === 0} title="Redo (Ctrl+Y)">
          ↻ Redo
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button size="sm" variant="outline" onClick={() => zoomAt(zoom * 1.2)} title="Zoom in">
          ＋
        </Button>
        <Button size="sm" variant="outline" onClick={() => zoomAt(zoom / 1.2)} title="Zoom out">
          －
        </Button>
        <Button size="sm" variant="outline" onClick={fitToScreen} title="Fit to screen">
          Fit
        </Button>
        <span className="text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <span className="flex-1" />
        {dirty ? <span className="text-xs text-amber-foreground">Unsaved changes</span> : null}
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save layout' : 'Saved'}
        </Button>
      </div>

      {notice ? <p className="text-sm text-amber-foreground">{notice}</p> : null}

      {pending ? (
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
          <span>
            Tap the canvas to place{' '}
            {pending.drag === 'new-table' ? typeById.get(pending.typeId)?.label ?? 'table' : pending.objectType}.
          </span>
          <Button size="sm" variant="outline" onClick={() => setPending(null)}>
            Cancel
          </Button>
        </div>
      ) : null}
    </>
  );
}
