import { useCallback, useLayoutEffect, useMemo, useState, useRef } from 'react';
import { Users, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { getEventLayout, listEventTableTypes } from '@/features/public/services/publicEventService';
import { quoteCart } from '@/features/public/services/paymentService';
import type { Table } from '@/shared/proto/booking';
import type { CartItem } from '@/features/public/services/pendingCart';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { addCents, subtractCents } from '@/shared/lib/math';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';

interface EventSeatingMapProps {
  eventsId: string;
  feesIncluded: boolean;
  cart: CartItem[];
  upsert: (item: CartItem) => void;
  removeKey: (key: string) => void;
}

const OBJECT_GLYPH: Record<string, string> = { Entry: '🚪', Exit: '🚪', Stage: '🎭' };

function shapeRadius(shape: string): string {
  switch (shape) {
    case 'Round':
    case 'Cocktail':
      return 'rounded-full';
    case 'Square':
      return 'rounded-none';
    default:
      return 'rounded-xl';
  }
}

interface HoveredTable extends Table {
  capacity: number;
  type?: { label: string; color?: string; shape?: string; capacity?: number };
  priceCents: number;
}

export function EventSeatingMap({
  eventsId,
  feesIncluded,
  cart,
  upsert,
  removeKey,
}: EventSeatingMapProps) {
  const layoutLoader = useCallback(() => getEventLayout(eventsId), [eventsId]);
  const { data: layout, loading } = useAsync(layoutLoader);
  const typesLoader = useCallback(() => listEventTableTypes(eventsId), [eventsId]);
  const { data: types } = useAsync(typesLoader);
  const typeById = useMemo(() => new Map((types ?? []).map((t) => [t.eventTablesId, t])), [types]);

  const pricingLoader = useCallback(async () => {
    if (!types || !layout) return null;
    const sampleTableByType = new Map<string, string>();
    for (const t of layout.tables) {
      if (!sampleTableByType.has(t.eventTablesId)) {
        sampleTableByType.set(t.eventTablesId, t.tablesId);
      }
    }
    const lines = types
      .filter((t) => t.pricesId && sampleTableByType.has(t.eventTablesId))
      .map((t) => ({ kind: 'Table' as const, refId: sampleTableByType.get(t.eventTablesId)!, seats: 0 }));
    if (lines.length === 0) return null;
    try {
      const quote = await quoteCart(eventsId, lines);
      const tableToType = new Map(layout.tables.map((t) => [t.tablesId, t.eventTablesId]));
      const entries = quote.lines
        .filter((l) => l.breakdown && tableToType.has(l.refId))
        .map((l) => [tableToType.get(l.refId)!, l.breakdown!] as const);
      return new Map(entries);
    } catch {
      return null;
    }
  }, [types, layout, eventsId]);
  const { data: tablePricing } = useAsync(pricingLoader);

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTable, setHoveredTable] = useState<HoveredTable | null>(null);


  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const userAdjusted = useRef(false);
  const armedTouchTable = useRef<string | null>(null);
  const isFirstTouchTap = useRef(false);

  const inCart = useCallback((key: string) => cart.some((i) => i.key === key), [cart]);

  const canvas = useMemo(() => {
    let w = 0;
    let h = 0;
    for (const t of layout?.tables ?? []) {
      w = Math.max(w, t.posX + (t.width || 80));
      h = Math.max(h, t.posY + (t.height || 80));
    }
    for (const o of layout?.objects ?? []) {
      w = Math.max(w, o.posX + (o.width || 80));
      h = Math.max(h, o.posY + (o.height || 80));
    }
    return { w: w + 64, h: h + 64 };
  }, [layout]);

  function capacityOf(table: Table): number {
    return table.capacityOverride || typeById.get(table.eventTablesId)?.capacity || 1;
  }

  function inspectTable(table: Table) {
    const type = typeById.get(table.eventTablesId);
    setHoveredTable({ ...table, capacity: capacityOf(table), type, priceCents: type?.priceCents || 0 });
  }

  function tableAriaLabel(table: Table, isSelected: boolean, isAvailable: boolean): string {
    const capacity = capacityOf(table);
    const bd = tablePricing?.get(table.eventTablesId);
    const price = bd ? centsToUSD(feesIncluded ? bd.finalPriceCents : bd.sellingPriceCents) : '';
    const status = isSelected ? 'in your order' : isAvailable ? 'available' : 'reserved';
    return [table.label, `${capacity} seats`, price, status].filter(Boolean).join(', ');
  }

  async function toggleTable(table: Table) {
    const key = `Table:${table.tablesId}`;
    if (inCart(key)) {
      removeKey(key);
      return;
    }
    if (isFirstTouchTap.current || hoveredTable?.tablesId !== table.tablesId) {
      isFirstTouchTap.current = false;
      inspectTable(table);
      return;
    }
    const cap = capacityOf(table);
    setPending(table.tablesId);
    setError(null);
    try {
      upsert({ key, kind: 'Table', refId: table.tablesId, label: table.label, seats: cap });
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setPending(null);
    }
  }


  const fitView = useCallback(() => {
    const el = containerRef.current;
    if (!el || !canvas.w || !canvas.h) return;
    const z = Math.min(el.clientWidth / canvas.w, el.clientHeight / canvas.h, 1.5);
    setZoom(z);
    setPan({ x: (el.clientWidth - canvas.w * z) / 2, y: (el.clientHeight - canvas.h * z) / 2 });
  }, [canvas]);

  useLayoutEffect(() => {
    fitView();
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (!userAdjusted.current) fitView();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitView]);

  const handleZoomIn = () => {
    userAdjusted.current = true;
    setZoom((z) => Math.min(2.5, z + 0.15));
  };
  const handleZoomOut = () => {
    userAdjusted.current = true;
    setZoom((z) => Math.max(0.2, z - 0.15));
  };
  const handleReset = () => {
    userAdjusted.current = false;
    fitView();
  };

  const handleMouseDown = (e: React.MouseEvent) => {

    if ((e.target as HTMLElement).closest('button')) return;
    userAdjusted.current = true;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-ink-soft font-bold uppercase tracking-widest animate-pulse">
        Loading interactive Seating Floorplan…
      </div>
    );
  }

  if (!layout || (layout.tables.length === 0 && layout.objects.length === 0)) {
    return null;
  }

  let tipStyle: React.CSSProperties | null = null;
  if (hoveredTable) {
    const w = hoveredTable.width || 80;
    const h = hoveredTable.height || 80;
    const cx = pan.x + (hoveredTable.posX + w / 2) * zoom;
    const topY = pan.y + hoveredTable.posY * zoom;
    const botY = pan.y + (hoveredTable.posY + h) * zoom;
    const cw = containerRef.current?.clientWidth ?? 0;
    const half = 112;
    const left = cw ? Math.min(Math.max(cx, half + 8), cw - half - 8) : cx;
    tipStyle = topY > 180
      ? { left, top: topY - 8, transform: 'translate(-50%, -100%)' }
      : { left, top: botY + 8, transform: 'translate(-50%, 0)' };
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm font-medium leading-normal">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="size-11 rounded-lg border border-border-soft cursor-pointer"
          aria-label="Zoom In"
        >
          <ZoomIn className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="size-11 rounded-lg border border-border-soft cursor-pointer"
          aria-label="Zoom Out"
        >
          <ZoomOut className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="size-11 rounded-lg border border-border-soft cursor-pointer"
          aria-label="Fit to Screen"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border-soft bg-stage shadow-2xl min-h-[500px]">
        { }
        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-3 sm:gap-4 bg-stage-elevated/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5 text-[10px] uppercase font-bold tracking-wider text-on-stage-soft">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-white border border-accent-gold" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-accent-burgundy" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-white/20" />
            <span>Reserved</span>
          </div>
        </div>

        { }
        {hoveredTable && tipStyle && (
          <div style={tipStyle} className="pointer-events-none absolute z-30 w-56 bg-stage-elevated/95 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-white font-display uppercase">{hoveredTable.label}</span>
              <span className="inline-flex items-center gap-1 rounded bg-accent-gold/10 text-accent-gold text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border border-accent-gold/20">
                Seating
              </span>
            </div>
            <div className="space-y-1.5 pt-1 text-white/70 font-medium">
              <p className="flex items-center gap-1.5">
                <Users className="size-3.5 text-accent-gold" /> Capacity: {hoveredTable.capacity} Seats
              </p>
              {(() => {
                const bd = tablePricing?.get(hoveredTable.eventTablesId);
                if (!bd) {
                  return (
                    <p className="font-extrabold text-white text-sm">
                      Total: {centsToUSD(feesIncluded ? addCents(hoveredTable.priceCents, 0) : hoveredTable.priceCents)}
                    </p>
                  );
                }
                const displayPrice = feesIncluded ? bd.finalPriceCents : bd.sellingPriceCents;
                const basePrice = feesIncluded ? addCents(bd.basePriceCents, subtractCents(bd.finalPriceCents, bd.sellingPriceCents)) : bd.basePriceCents;
                const hasDiscount = bd.sellingPriceCents !== bd.basePriceCents;
                return (
                  <>
                    <p className="font-extrabold text-white text-sm">
                      Total:{' '}
                      {hasDiscount ? (
                        <span className="inline-flex items-baseline gap-1.5">
                          <span className="line-through text-white/40 text-xs font-semibold">
                            {centsToUSD(basePrice)}
                          </span>
                          <span className="text-success">
                            {centsToUSD(displayPrice)}
                          </span>
                        </span>
                      ) : (
                        centsToUSD(displayPrice)
                      )}
                    </p>
                    {!feesIncluded && bd.platformFeeCents > 0 && (
                      <p className="text-[9px] text-white/40">
                        (+ {centsToUSD(bd.platformFeeCents)} platform service fee)
                      </p>
                    )}
                  </>
                );
              })()}
              {!inCart(`Table:${hoveredTable.tablesId}`) && (
                <p className="pt-1 text-[10px] font-semibold uppercase tracking-wider text-accent-gold">
                  Tap again to add to your order
                </p>
              )}
            </div>
          </div>
        )}

        { }
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={cn(
            'w-full h-[500px] relative select-none touch-none',
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
        >
          { }
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(color-mix(in srgb, var(--on-stage) 8%, transparent) 1px, transparent 1px),
                linear-gradient(90deg, color-mix(in srgb, var(--on-stage) 8%, transparent) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          />

          { }
          <div
            className="absolute"
            style={{
              width: canvas.w,
              height: canvas.h,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            { }
            {layout.objects.map((o) => (
              <div
                key={o.layoutObjectsId}
                style={{
                  position: 'absolute',
                  left: o.posX,
                  top: o.posY,
                  width: o.width || 80,
                  height: o.height || 80,
                }}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-stage-elevated text-white/50 text-[10px] font-extrabold uppercase tracking-wider shadow-md"
              >
                <span className="text-lg mb-1">{OBJECT_GLYPH[o.objectType] || '⚙'}</span>
                {o.objectType}
              </div>
            ))}

            { }
            {layout.tables.map((table) => {
              const type = typeById.get(table.eventTablesId);
              const isAvailable = table.status === 'Available';
              const isSelected = inCart(`Table:${table.tablesId}`);
              const capacity = capacityOf(table);
              const shape = table.shapeOverride || type?.shape || 'Rectangle';


              const bgStyle = isSelected
                ? 'linear-gradient(155deg, color-mix(in srgb, var(--accent-burgundy) 88%, white), var(--accent-burgundy))'
                : isAvailable
                  ? 'linear-gradient(155deg, var(--surface-card), color-mix(in srgb, var(--surface-card) 85%, var(--accent-gold)))'
                  : 'color-mix(in srgb, var(--stage-elevated) 75%, var(--brand))';

              const borderStyle = isSelected
                ? '2px solid var(--accent-burgundy)'
                : isAvailable
                  ? '3px solid var(--accent-gold)'
                  : '1px solid color-mix(in srgb, var(--stage-elevated) 60%, var(--brand))';

              const textStyle = isSelected
                ? 'text-white'
                : isAvailable
                  ? 'text-foreground'
                  : 'text-white/20';

              return (
                <button
                  key={table.tablesId}
                  type="button"
                  disabled={!isAvailable || pending === table.tablesId}
                  aria-pressed={isSelected}
                  aria-label={tableAriaLabel(table, isSelected, isAvailable)}
                  onMouseEnter={() => isAvailable && inspectTable(table)}
                  onMouseLeave={() => setHoveredTable(null)}
                  onFocus={() => isAvailable && inspectTable(table)}
                  onBlur={() => setHoveredTable(null)}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      isFirstTouchTap.current = armedTouchTable.current !== table.tablesId;
                      armedTouchTable.current = table.tablesId;
                    } else {
                      isFirstTouchTap.current = false;
                    }
                  }}
                  onClick={() => toggleTable(table)}
                  style={{
                    position: 'absolute',
                    left: table.posX,
                    top: table.posY,
                    width: table.width || 80,
                    height: table.height || 80,
                    background: bgStyle,
                    border: borderStyle,
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center text-[10px] font-black transition-all duration-300 shadow-md',
                    shapeRadius(shape),
                    textStyle,
                    isAvailable
                      ? 'cursor-pointer hover:scale-110 hover:-translate-y-1 hover:shadow-[0_8px_20px_color-mix(in_srgb,var(--accent-gold)_35%,transparent)] active:scale-95 z-20'
                      : 'cursor-not-allowed'
                  )}
                >
                  { }
                  {isSelected && (
                    <span className="mb-0.5 flex size-4 items-center justify-center rounded-full bg-white text-accent-burgundy shadow-[0_0_10px_color-mix(in_srgb,var(--surface)_40%,transparent)]">
                      <Check className="size-2.5 stroke-[3]" />
                    </span>
                  )}
                  <span className="max-w-full truncate px-1 font-display font-black text-sm uppercase tracking-tight">{table.label}</span>
                  <span className="text-[8px] opacity-60 font-mono mt-0.5">{capacity} PAX</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
