import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listTableTemplates,
  createTableTemplate,
  updateTableTemplate,
} from '@/features/admin/services/tableTemplateService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUsdInput, usdToCents } from '@/shared/lib/format';
import { playSuccessChime } from '@/shared/lib/haptic';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Select } from '@/shared/ui/select';
import { CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { cn } from '@/shared/lib/cn';
import { Palette, Edit3, X } from 'lucide-react';
import type { TableTemplate } from '@/shared/proto/booking';

const SHAPES = ['Round', 'Rectangle', 'Square', 'Cocktail'];

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

function playTap(type: 'click' | 'toggle-on' | 'toggle-off' | 'focus' | 'success') {
  if (type === 'success') playSuccessChime();
}

function nextUnusedColor(used: string[]): string {
  const taken = new Set(used.map((c) => c.toLowerCase()));
  return COLOR_PALETTE.find((c) => !taken.has(c.toLowerCase())) ?? '#3b82f6';
}

export function AdminTableTypesPage() {
  const loader = useCallback(() => listTableTemplates(), []);
  const { data, loading, error, reload } = useAsync(loader);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [colorOverride, setColorOverride] = useState<string | null>(null);
  const suggestedColor = nextUnusedColor((data ?? []).map((t) => t.defaultColor || '').filter(Boolean));
  const color = colorOverride ?? suggestedColor;

  const [capacity, setCapacity] = useState(8);
  const [priceUsd, setPriceUsd] = useState('0.00');
  const [width, setWidth] = useState(80);
  const [height, setHeight] = useState(80);
  const [shape, setShape] = useState('Round');
  const [allInclusive, setAllInclusive] = useState(true);

  async function add() {
    setNotice(null);
    playTap('success');
    try {
      await createTableTemplate({
        name,
        defaultColor: color,
        defaultCapacity: capacity,
        defaultPriceCents: usdToCents(priceUsd),
        defaultWidth: width,
        defaultHeight: height,
        defaultShape: shape,
        defaultIsAllInclusive: allInclusive,
      });
      setName('');
      setPriceUsd('0.00');
      setColorOverride(null);
      reload();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight font-display text-foreground md:text-3xl">Table Types</h1>
        <p className="text-xs text-muted-foreground">Configure lounge templates, seat counts, and baseline catalog rates.</p>
      </div>

      { }
      <div
        className="entryvine-float-card border border-border bg-card shadow-xl rounded-2xl overflow-hidden transition-all duration-300"
      >
        <CardHeader className="border-b border-border/20 px-6 py-4">
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Palette className="h-4.5 w-4.5 text-primary" /> Add Table Template
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {notice ? (
            <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 leading-normal animate-shake">
              {notice}
            </p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Name (Locked after creation)</Label>
              <div className="entryvine-spring-input">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => playTap('focus')}
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
                  value={color}
                  onChange={(e) => { playTap('click'); setColorOverride(e.target.value); }}
                  className="h-6 w-9 p-0 border-0 cursor-pointer rounded"
                />
                <span className="text-[11px] font-mono text-muted-foreground uppercase">{color}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Shape</Label>
              <Select
                value={shape}
                onChange={(e) => { playTap('click'); setShape(e.target.value); }}
              >
                {SHAPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Capacity (Seats)</Label>
              <div className="entryvine-spring-input">
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  onFocus={() => playTap('focus')}
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Base Price (USD)</Label>
              <div className="entryvine-spring-input">
                <Input
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  onFocus={() => playTap('focus')}
                  className="h-10 bg-background border-border text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Width (px)</Label>
              <div className="entryvine-spring-input">
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  onFocus={() => playTap('focus')}
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Height (px)</Label>
              <div className="entryvine-spring-input">
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  onFocus={() => playTap('focus')}
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>
          </div>

          { }
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border/20 pt-4">
            <div className="flex items-center gap-2 py-1.5">
              <Switch
                checked={allInclusive}
                onCheckedChange={(val) => { playTap(val ? 'toggle-on' : 'toggle-off'); setAllInclusive(val); }}
                label="All-inclusive"
              />
              <Label className="text-xs font-semibold text-muted-foreground cursor-pointer">Bottle service and tax included</Label>
            </div>

            <Button
              onClick={add}
              disabled={!name.trim()}
              className={cn(
                "entryvine-spring-btn h-11 px-8 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20",
                !name.trim() && "opacity-40 cursor-not-allowed"
              )}
            >
              Add Template
            </Button>
          </div>
        </CardContent>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 justify-center py-8">
          <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Refreshing database catalog…</p>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 leading-normal">{error}</p>
      ) : null}

      { }
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data ?? []).map((template) => (
          <TableTypeRow key={template.tableTemplatesId} template={template} onChanged={reload} />
        ))}
      </div>
    </div>
  );
}

function TableTypeRow({ template, onChanged }: { template: TableTemplate; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [color, setColor] = useState(template.defaultColor || '#3b82f6');
  const [capacity, setCapacity] = useState(template.defaultCapacity);
  const [priceUsd, setPriceUsd] = useState(centsToUsdInput(template.defaultPriceCents));
  const [width, setWidth] = useState(template.defaultWidth);
  const [height, setHeight] = useState(template.defaultHeight);
  const [shape, setShape] = useState(template.defaultShape || 'Round');
  const [allInclusive, setAllInclusive] = useState(template.defaultIsAllInclusive);

  async function persist(isActive: boolean) {
    setNotice(null);
    playTap('success');
    try {
      await updateTableTemplate({
        tableTemplatesId: template.tableTemplatesId,
        defaultColor: color,
        defaultCapacity: capacity,
        defaultPriceCents: usdToCents(priceUsd),
        defaultWidth: width,
        defaultHeight: height,
        defaultShape: shape,
        defaultIsAllInclusive: allInclusive,
        isActive,
      });
      setEditing(false);
      onChanged();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  const activeColor = template.defaultColor || '#ccc';

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-all duration-300 overflow-hidden flex flex-col h-fit",
        template.isActive
          ? "border-border shadow-md"
          : "border-border-soft opacity-60 bg-muted/30 shadow-none scale-[0.99] translate-y-1"
      )}
    >
      <CardContent className="p-5 space-y-4">
        { }
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            { }
            <div className="relative group shrink-0">
              <span
                className="inline-block h-6 w-6 rounded-full border border-black/10 transition-transform duration-200 group-hover:scale-125 shadow-inner"
                style={{ backgroundColor: activeColor }}
              />
              { }
              <div className="absolute top-1/2 left-8 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-popover border border-border p-1.5 rounded-lg shadow-xl z-20">
                {COLOR_PALETTE.slice(0, 8).map((paletteColor) => (
                  <button
                    key={paletteColor}
                    onClick={() => { playTap('click'); setColor(paletteColor); }}
                    style={{ backgroundColor: paletteColor }}
                    className="size-3.5 rounded-full border-0 cursor-pointer hover:scale-110 transition-transform"
                    title={paletteColor}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-sm text-foreground font-display block">{template.name}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                {template.defaultCapacity} Seats · {template.defaultShape}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={template.isActive}
              onCheckedChange={(v) => { playTap(v ? 'toggle-on' : 'toggle-off'); persist(v); }}
              label="Enabled"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { playTap('click'); setEditing((v) => !v); }}
              className="h-8 text-xs font-semibold hover:bg-muted/40"
            >
              {editing ? <X className="h-3.5 w-3.5 mr-1" /> : <Edit3 className="h-3.5 w-3.5 mr-1" />}
              {editing ? 'Close' : 'Edit'}
            </Button>
          </div>
        </div>

        {notice ? (
          <p className="text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 leading-normal animate-shake">
            {notice}
          </p>
        ) : null}

        { }
        <div className={cn(
          "grid transition-all duration-300 ease-in-out overflow-hidden border-t border-border/20 pt-1.5",
          editing ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="overflow-hidden space-y-4 pt-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Color</Label>
                <div className="flex items-center gap-1.5 h-9 border border-border bg-background rounded-lg px-2">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-5 w-7 p-0 border-0 cursor-pointer rounded"
                  />
                  <span className="text-[9px] font-mono text-muted-foreground uppercase">{color}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">Capacity</Label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="h-9 bg-background text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">Price (USD)</Label>
                <Input
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="h-9 bg-background text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">Shape</Label>
                <Select
                  className="h-9 text-xs"
                  value={shape}
                  onChange={(e) => setShape(e.target.value)}
                >
                  {SHAPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">Width (px)</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="h-9 bg-background text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">Height (px)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="h-9 bg-background text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/10 pt-3">
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={allInclusive}
                  onCheckedChange={(val) => { playTap(val ? 'toggle-on' : 'toggle-off'); setAllInclusive(val); }}
                  label="All-inclusive"
                />
                <Label className="text-[10px] text-muted-foreground font-semibold">All-inclusive</Label>
              </div>

              <Button
                onClick={() => persist(template.isActive)}
                size="sm"
                className="entryvine-spring-btn h-9 px-6 rounded-lg font-bold text-xs"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
