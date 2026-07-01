import { useCallback, useMemo, useState, useRef } from 'react';
import { Users, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { getEventLayout, listEventTableTypes, calculatePrice } from '@/features/public/services/publicEventService';
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
    if (!types) return null;
    try {
      const entries = await Promise.all(
        types.map(async (t) => {
          if (!t.pricesId) return null;
          const bd = await calculatePrice(t.pricesId, t.capacity);
          return [t.eventTablesId, bd] as const;
        })
      );
      return new Map(entries.filter((e): e is Exclude<typeof e, null> => e !== null));
    } catch {
      return null;
    }
  }, [types]);
  const { data: tablePricing } = useAsync(pricingLoader);

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTable, setHoveredTable] = useState<HoveredTable | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

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

  async function toggleTable(table: Table) {
    const key = `Table:${table.tablesId}`;
    if (inCart(key)) {
      removeKey(key);
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

  // Pan/Zoom Handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, z - 0.15));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on canvas or drag background clicks
    if ((e.target as HTMLElement).closest('button')) return;
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
      <div className="py-12 text-center text-xs text-white/50 font-bold uppercase tracking-widest animate-pulse">
        Loading interactive Seating Floorplan…
      </div>
    );
  }

  if (!layout || (layout.tables.length === 0 && layout.objects.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-bold leading-normal">
          {error}
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-border-soft bg-surface-900 shadow-2xl min-h-[500px]">
        {/* Floorplan Controls Overlay */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-surface-800/90 backdrop-blur-md p-1.5 rounded-xl border border-white/5 shadow-lg">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="size-8 rounded-lg hover:bg-white/10 text-white cursor-pointer"
            aria-label="Zoom In"
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="size-8 rounded-lg hover:bg-white/10 text-white cursor-pointer"
            aria-label="Zoom Out"
          >
            <ZoomOut className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="size-8 rounded-lg hover:bg-white/10 text-white cursor-pointer"
            aria-label="Reset View"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-30 hidden sm:flex items-center gap-4 bg-surface-800/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5 text-[10px] uppercase font-bold tracking-wider text-white/70">
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

        {/* Dynamic Detail Card overlay on table hover */}
        {hoveredTable && (
          <div className="absolute top-4 right-4 z-30 w-56 bg-surface-800/95 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-white font-display uppercase">{hoveredTable.label}</span>
              <span className="inline-flex items-center gap-1 rounded bg-accent-gold/10 text-accent-gold text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border border-accent-gold/20">
                VIP Seating
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
                          <span className="text-emerald-400">
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
            </div>
          </div>
        )}

        {/* Map Canvas Frame */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={cn(
            'w-full h-[500px] relative select-none touch-none',
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
        >
          {/* Blueprint vector grids */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          />

          {/* Seating Coordinate Wrapper */}
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
            {/* 1. Structural Stage & Entry Objects */}
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
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-surface-800 text-white/50 text-[10px] font-extrabold uppercase tracking-wider shadow-md"
              >
                <span className="text-lg mb-1">{OBJECT_GLYPH[o.objectType] || '⚙'}</span>
                {o.objectType}
              </div>
            ))}

            {/* 2. Seating Tables */}
            {layout.tables.map((table) => {
              const type = typeById.get(table.eventTablesId);
              const isAvailable = table.status === 'Available';
              const isSelected = inCart(`Table:${table.tablesId}`);
              const capacity = capacityOf(table);
              const shape = table.shapeOverride || type?.shape || 'Rectangle';

              // Interactive States Colors
              const bgStyle = isSelected
                ? 'var(--accent-burgundy)'
                : isAvailable
                  ? 'var(--surface-card)'
                  : '#2F1D2C'; // reserved/unavailable color

              const borderStyle = isSelected
                ? '2px solid var(--accent-burgundy)'
                : isAvailable
                  ? '3px solid var(--accent-gold)'
                  : '1px solid #3D273A';

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
                  onMouseEnter={() =>
                    isAvailable &&
                    setHoveredTable({ ...table, capacity, type, priceCents: type?.priceCents || 0 })
                  }
                  onMouseLeave={() => setHoveredTable(null)}
                  onClick={() => toggleTable(table)}
                  style={{
                    position: 'absolute',
                    left: table.posX,
                    top: table.posY,
                    width: table.width || 80,
                    height: table.height || 80,
                    backgroundColor: bgStyle,
                    border: borderStyle,
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center text-[10px] font-black transition-all duration-300 shadow-md',
                    shapeRadius(shape),
                    textStyle,
                    isAvailable
                      ? 'cursor-pointer hover:scale-105 hover:shadow-[0_0_15px_rgba(245,165,36,0.3)] active:scale-95 z-20'
                      : 'cursor-not-allowed'
                  )}
                >
                  {/* Glowing selection dot inside the table */}
                  {isSelected ? (
                    <span className="flex size-4.5 items-center justify-center rounded-full bg-white text-accent-burgundy shadow-[0_0_10px_rgba(255,255,255,0.4)] animate-bounce">
                      <Check className="size-3 stroke-[3]" />
                    </span>
                  ) : (
                    <>
                      <span className="font-display font-black text-sm uppercase tracking-tight">{table.label}</span>
                      <span className="text-[8px] opacity-60 font-mono mt-0.5">{capacity} PAX</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
