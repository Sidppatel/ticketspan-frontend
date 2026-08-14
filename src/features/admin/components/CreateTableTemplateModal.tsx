import { LayoutGrid } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';

interface CreateTableTemplateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newTemplateName: string;
  setNewTemplateName: (v: string) => void;
  newTemplateColor: string;
  setNewTemplateColor: (v: string) => void;
  newTemplateShape: string;
  setNewTemplateShape: (v: string) => void;
  newTemplateCapacity: number;
  setNewTemplateCapacity: (v: number) => void;
  newTemplatePriceUsd: string;
  setNewTemplatePriceUsd: (v: string) => void;
  newTemplateWidth: number;
  setNewTemplateWidth: (v: number) => void;
  newTemplateHeight: number;
  setNewTemplateHeight: (v: number) => void;
  newTemplateAllInclusive: boolean;
  setNewTemplateAllInclusive: (v: boolean) => void;
  newTemplateError: string | null;
  setNewTemplateError: (v: string | null) => void;
  newTemplateSubmitting: boolean;
  handleCreateTableTemplate: () => void;
}

export function CreateTableTemplateModal({
  isOpen,
  onOpenChange,
  newTemplateName,
  setNewTemplateName,
  newTemplateColor,
  setNewTemplateColor,
  newTemplateShape,
  setNewTemplateShape,
  newTemplateCapacity,
  setNewTemplateCapacity,
  newTemplatePriceUsd,
  setNewTemplatePriceUsd,
  newTemplateWidth,
  setNewTemplateWidth,
  newTemplateHeight,
  setNewTemplateHeight,
  newTemplateAllInclusive,
  setNewTemplateAllInclusive,
  newTemplateError,
  setNewTemplateError,
  newTemplateSubmitting,
  handleCreateTableTemplate,
}: CreateTableTemplateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-lg font-bold font-display text-foreground flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" /> Create Table Template
        </DialogTitle>
        <div className="space-y-4 py-4">
          {newTemplateError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive animate-shake">
              {newTemplateError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Name</Label>
              <div className="ticketspan-spring-input">
                <Input
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Center Lounge"
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Color Swatch</Label>
              <div className="flex items-center gap-2 h-10 border border-border bg-background rounded-lg px-2.5">
                <Input
                  type="color"
                  value={newTemplateColor}
                  onChange={(e) => setNewTemplateColor(e.target.value)}
                  className="h-6 w-9 p-0 border-0 cursor-pointer rounded"
                />
                <span className="text-[11px] font-mono text-muted-foreground uppercase">{newTemplateColor}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Shape</Label>
              <Select
                value={newTemplateShape}
                onChange={(e) => setNewTemplateShape(e.target.value)}
              >
                {['Round', 'Rectangle', 'Square', 'Cocktail'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Capacity (Seats)</Label>
              <div className="ticketspan-spring-input">
                <Input
                  type="number"
                  value={newTemplateCapacity}
                  onChange={(e) => setNewTemplateCapacity(Number(e.target.value))}
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Base Price (USD)</Label>
              <div className="ticketspan-spring-input">
                <Input
                  value={newTemplatePriceUsd}
                  onChange={(e) => setNewTemplatePriceUsd(e.target.value)}
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Width (px)</Label>
              <div className="ticketspan-spring-input">
                <Input
                  type="number"
                  value={newTemplateWidth}
                  onChange={(e) => setNewTemplateWidth(Number(e.target.value))}
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Height (px)</Label>
              <div className="ticketspan-spring-input">
                <Input
                  type="number"
                  value={newTemplateHeight}
                  onChange={(e) => setNewTemplateHeight(Number(e.target.value))}
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>

            <div className="flex items-center md:col-span-2 py-2 gap-2 text-sm font-semibold">
              <Switch
                checked={newTemplateAllInclusive}
                onCheckedChange={setNewTemplateAllInclusive}
                label="All-inclusive"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                setNewTemplateError(null);
              }}
              disabled={newTemplateSubmitting}
              className="h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateTableTemplate}
              disabled={newTemplateSubmitting || !newTemplateName.trim()}
              className="ticketspan-spring-btn h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20"
            >
              {newTemplateSubmitting ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
