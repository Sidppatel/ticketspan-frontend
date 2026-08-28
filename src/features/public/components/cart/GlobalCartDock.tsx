import { useCartStore, isCartItemExpired, type UniversalCartItem } from '@/shared/lib/cartStore';
import { ShoppingBag, ChevronRight, X, Plus, Minus, Calendar, MapPin, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { centsToUSD, formatEventDate } from '@/shared/lib/format';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { Badge } from '@/shared/ui/badge';
import { CartItemCountdown } from '@/features/public/components/cart/CartItemCountdown';
import { cn } from '@/shared/lib/cn';
import { useState, useEffect, useCallback } from 'react';
import { quoteCart, cartServiceFeeCents } from '@/features/public/services/paymentService';
import type { CartQuote } from '@/shared/proto/bookings';
import { toast } from 'sonner';

function calculateLineTotal(val1: number, val2: number): number {
  return val1 * val2;
}
function addNum(a: number, b: number): number {
  return a + b;
}

interface GlobalCartDockProps {
  onCheckout: () => void;
}

export function GlobalCartDock({ onCheckout }: GlobalCartDockProps) {
  const {
    items,
    isOpen,
    setOpen,
    updateQuantity,
    reclaimItem,
    removeItem,
    clearCart,
    totalItemCount,
    subtotalCents,
    groupedByEvent,
  } = useCartStore();

  const count = totalItemCount();
  const subtotal = subtotalCents();
  const eventGroups = groupedByEvent();
  const eventIds = Object.keys(eventGroups);

  const [quotes, setQuotes] = useState<Record<string, CartQuote>>({});
  const [reclaimingAll, setReclaimingAll] = useState(false);

  useEffect(() => {
    const currentEventGroups = useCartStore.getState().groupedByEvent();
    const currentEventIds = Object.keys(currentEventGroups);

    let active = true;

    async function loadQuotes() {
      const results: Record<string, CartQuote> = {};
      for (const eventId of currentEventIds) {
        const groupItems = currentEventGroups[eventId] || [];
        const lines = groupItems.map((i) => ({
          kind: i.kind,
          refId: i.refId,
          seats: i.kind === 'Ticket' ? i.seats : 0,
        }));
        try {
          const q = await quoteCart(eventId, lines);
          results[eventId] = q;
        } catch {
          void 0;
        }
      }
      if (active) {
        setQuotes(results);
      }
    }

    loadQuotes();
    return () => {
      active = false;
    };
  }, [items]);

  const handleReclaim = useCallback(async (item: UniversalCartItem) => {
    try {

      await quoteCart(item.eventId, [{
        kind: item.kind,
        refId: item.refId,
        seats: item.kind === 'Ticket' ? item.seats : 0,
      }]);

      reclaimItem(item.id);
      toast.success(`${item.label} re-claimed!`, {
        description: 'Your hold timer has been restarted.',
      });
    } catch {
      toast.error(`Unable to re-claim ${item.label}`, {
        description: 'This pass may no longer be available or sold out.',
      });
    }
  }, [reclaimItem]);

  const handleReclaimAllExpired = useCallback(async () => {
    setReclaimingAll(true);
    const expiredItems = items.filter((i) => isCartItemExpired(i));
    let reclaimedCount = 0;

    for (const item of expiredItems) {
      try {
        await quoteCart(item.eventId, [{
          kind: item.kind,
          refId: item.refId,
          seats: item.kind === 'Ticket' ? item.seats : 0,
        }]);
        reclaimItem(item.id);
        reclaimedCount++;
      } catch {
        void 0;
      }
    }

    setReclaimingAll(false);
    if (reclaimedCount > 0) {
      toast.success(`Re-claimed ${reclaimedCount} item(s)!`, {
        description: 'Your hold timers have been refreshed.',
      });
    } else {
      toast.error('Could not re-claim expired items. They may be sold out.');
    }
  }, [items, reclaimItem]);

  let totalSubtotalCents = 0;
  let totalDiscountCents = 0;
  let totalServiceFeeCents = 0;
  let totalTaxCents = 0;
  let totalChargeCents = 0;

  for (const eventId of eventIds) {
    const q = quotes[eventId];
    const groupItems = eventGroups[eventId] || [];
    const fallbackSubtotal = groupItems.reduce((s, i) => s + calculateLineTotal(i.unitPriceCents, i.seats), 0);

    if (q) {
      totalSubtotalCents += q.subtotalCents;
      totalDiscountCents += q.discountCents;
      totalServiceFeeCents += cartServiceFeeCents(q);
      totalTaxCents += q.taxCents;
      totalChargeCents += q.totalCents;
    } else {
      totalSubtotalCents += fallbackSubtotal;
      totalChargeCents += fallbackSubtotal;
    }
  }

  const grandTotal = totalChargeCents > 0 ? totalChargeCents : subtotal;
  const hasExpired = items.some((i) => isCartItemExpired(i));

  if (count === 0 && !isOpen) {
    return null;
  }

  return (
    <>
      {}
      {count > 0 && !isOpen && (
        <aside
          aria-label="Shopping Cart Notification"
          className="fixed bottom-28 md:bottom-6 right-4 md:right-6 z-50 animate-in fade-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              'group flex items-center gap-3 rounded-full border bg-[#131722]/95 px-4 py-2.5 md:px-5 md:py-3 text-white shadow-2xl backdrop-blur-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer',
              hasExpired
                ? 'border-rose-500/50 shadow-rose-500/20 hover:border-rose-400'
                : 'border-white/20 hover:border-amber-400/50 hover:shadow-amber-500/20',
            )}
          >
            <div
              className={cn(
                'relative flex size-9 md:size-10 items-center justify-center rounded-full font-bold shadow-md transition-colors',
                hasExpired
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-400 text-slate-950 group-hover:bg-amber-300',
              )}
            >
              <ShoppingBag className="size-4 md:size-5" />
              <span className="absolute -top-1.5 -right-1.5 flex size-4.5 md:size-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-[#131722]">
                {count}
              </span>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[10px] md:text-[11px] uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
                {eventIds.length} {eventIds.length === 1 ? 'Event' : 'Events'} in Cart
                {hasExpired && <span className="text-rose-400 font-bold">• Expired</span>}
              </span>
              <span className="font-mono text-sm md:text-base font-bold text-white">
                {centsToUSD(grandTotal)}
              </span>
            </div>

            <div
              className={cn(
                'ml-1 md:ml-2 flex items-center gap-1 rounded-full px-2.5 py-1 md:px-3 md:py-1.5 text-xs font-bold transition-all',
                hasExpired
                  ? 'bg-rose-500/20 text-rose-300 group-hover:bg-rose-500 group-hover:text-white'
                  : 'bg-white/10 text-amber-400 group-hover:bg-amber-400 group-hover:text-slate-950',
              )}
            >
              <span>View Cart</span>
              <ChevronRight className="size-3.5" />
            </div>
          </button>
        </aside>
      )}

      {}
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          hideCloseButton={true}
          className="w-full sm:max-w-lg bg-[#0c0f17] border-l border-white/10 text-white flex flex-col p-0 shadow-2xl overflow-hidden backdrop-blur-2xl h-full"
        >
          <SheetTitle className="sr-only">Event Shopping Cart</SheetTitle>

          {}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#131722]/90 px-6 py-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-400">
                <ShoppingBag className="size-5" />
              </div>
              <div>
                <h3 className="font-sans text-base font-bold text-white">Your Cart</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {count} {count === 1 ? 'ticket' : 'tickets'} across {eventIds.length} {eventIds.length === 1 ? 'event' : 'events'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {count > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-400 font-semibold px-2 py-1 transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Close cart"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {}
          {hasExpired && (
            <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="size-4 text-rose-400 shrink-0" />
                <span className="text-rose-300 font-medium truncate">
                  Some hold timers expired. Re-claim before checkout.
                </span>
              </div>
              <button
                type="button"
                onClick={handleReclaimAllExpired}
                disabled={reclaimingAll}
                className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 text-[11px] font-mono font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className={cn('size-3', reclaimingAll && 'animate-spin')} />
                <span>{reclaimingAll ? 'Reclaiming…' : 'Re-claim All'}</span>
              </button>
            </div>
          )}

          {}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
            {count === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-slate-500">
                  <ShoppingBag className="size-8" />
                </div>
                <h4 className="font-sans text-lg font-bold text-white">Your Cart is Empty</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Browse events and select tickets or lounge tables to checkout in a single quick purchase.
                </p>
              </div>
            ) : (
              eventIds.map((eventId) => {
                const groupItems = eventGroups[eventId];
                const first = groupItems[0];
                const eventSubtotal = groupItems.reduce((s, i) => s + calculateLineTotal(i.unitPriceCents, i.seats), 0);

                return (
                  <div key={eventId} className="rounded-2xl border border-white/10 bg-[#131722]/80 overflow-hidden shadow-lg">
                    {}
                    <div className="border-b border-white/10 bg-white/5 px-4 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-sans text-sm font-bold text-white truncate">
                          {first.eventTitle}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                          {first.eventDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3 text-amber-400" />
                              {formatEventDate(first.eventDate)}
                            </span>
                          )}
                          {first.venueName && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="size-3 text-amber-400" />
                              {first.venueName}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-400 shrink-0">
                        {centsToUSD(eventSubtotal)}
                      </span>
                    </div>

                    {}
                    <div className="divide-y divide-white/5 p-2">
                      {groupItems.map((item: UniversalCartItem) => {
                        const expired = isCartItemExpired(item);

                        return (
                          <div
                            key={item.id}
                            className={cn(
                              'flex items-center justify-between p-2.5 text-xs rounded-xl transition-colors',
                              expired && 'bg-rose-500/5',
                            )}
                          >
                            <div className="min-w-0 pr-3 space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] font-mono uppercase bg-white/5 border-white/15">
                                  {item.kind}
                                </Badge>
                                <span className={cn('font-bold truncate', expired ? 'text-white/70' : 'text-white')}>
                                  {item.label}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[11px] font-mono text-slate-400">
                                  {centsToUSD(item.unitPriceCents)} each
                                </p>
                                <span className="text-white/20">•</span>
                                <CartItemCountdown item={item} onReclaim={handleReclaim} />
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {item.kind === 'Ticket' ? (
                                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, addNum(item.seats, -1))}
                                    className="flex size-6 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                  >
                                    <Minus className="size-3" />
                                  </button>
                                  <span className="w-6 text-center font-mono font-bold text-white text-xs">
                                    {item.seats}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, addNum(item.seats, 1))}
                                    className="flex size-6 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                  >
                                    <Plus className="size-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="font-mono text-xs text-slate-300">1 table</span>
                              )}

                              <span className="font-mono font-bold text-white text-xs w-16 text-right">
                                {centsToUSD(calculateLineTotal(item.unitPriceCents, item.seats))}
                              </span>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                                aria-label="Remove item"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {}
          {count > 0 && (
            <div className="border-t border-white/10 bg-[#131722]/95 p-6 backdrop-blur-xl space-y-4">
              <div className="space-y-1.5 text-xs">
                {totalDiscountCents > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Savings</span>
                    <span className="font-mono">-{centsToUSD(totalDiscountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal ({count} {count === 1 ? 'ticket' : 'tickets'})</span>
                  <span className="font-mono font-semibold text-white">{centsToUSD(totalSubtotalCents > 0 ? totalSubtotalCents : subtotal)}</span>
                </div>
                {totalServiceFeeCents > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Service fee</span>
                    <span className="font-mono">{centsToUSD(totalServiceFeeCents)}</span>
                  </div>
                )}
                {totalTaxCents > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax</span>
                    <span className="font-mono">{centsToUSD(totalTaxCents)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10 text-base">
                  <span>Total</span>
                  <span className="font-mono text-amber-400">{centsToUSD(grandTotal)}</span>
                </div>
              </div>

              {hasExpired ? (
                <div className="space-y-2">
                  <Button
                    onClick={handleReclaimAllExpired}
                    disabled={reclaimingAll}
                    className="w-full h-12 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans text-sm font-bold tracking-wide shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className={cn('size-4', reclaimingAll && 'animate-spin')} />
                    <span>{reclaimingAll ? 'Re-claiming passes…' : 'Re-claim Expired Passes'}</span>
                  </Button>
                  <p className="text-center font-mono text-[11px] text-rose-400">
                    Please re-claim expired tickets to secure a fresh hold window before checkout.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    onCheckout();
                  }}
                  className="w-full h-12 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans text-sm font-bold tracking-wide shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Proceed to Checkout ({centsToUSD(grandTotal)}) <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
