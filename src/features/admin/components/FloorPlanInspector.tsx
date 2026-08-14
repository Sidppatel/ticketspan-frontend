import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import type { PlacedTable, PlacedObject } from './FloorPlanBuilder';

interface FloorPlanInspectorProps {
  selTable: PlacedTable | null;
  selObject: PlacedObject | null;
  isTableLocked: (table: PlacedTable) => boolean;
  updateSelectedTable: (patch: Partial<PlacedTable>, updateTypeDefaults?: boolean) => void;
  updateSelectedObject: (patch: Partial<PlacedObject>) => void;
  deleteSelected: () => void;
}

export function FloorPlanInspector({
  selTable,
  selObject,
  isTableLocked,
  updateSelectedTable,
  updateSelectedObject,
  deleteSelected,
}: FloorPlanInspectorProps) {
  if (!selTable && !selObject) return null;

  return (
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
  );
}
