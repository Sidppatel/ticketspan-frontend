import { useCartStore, type UniversalCartItem } from '@/shared/lib/cartStore';
import { ShoppingBag, ChevronRight, X, Plus, Minus, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { centsToUSD, formatEventDate } from '@/shared/lib/format';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/cn';
import { useState, useEffect } from 'react';
import { quoteCart, cartServiceFeeCents } from '@/features/public/services/paymentService';
import type { CartQuote } from '@/shared/proto/bookings';

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
  const { items, isOpen, setOpen, updateQuantity, removeItem, clearCart, totalItemCount, subtotalCents, groupedByEvent } = useCartStore();

  const count = totalItemCount();
  const subtotal = subtotalCents();
  const eventGroups = groupedByEvent();
  const eventIds = Object.keys(eventGroups);

  const [quotes, setQuotes] = useState<Record<string, CartQuote>>({});

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
          // fallback
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

  if (count === 0 && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Floating Spring Dock / Pill at Bottom */}
      {count > 0 && !isOpen && (
        <aside
          aria-label="Shopping Cart Notification"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 animate-in fade-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              'group flex items-center gap-3 rounded-full border border-white/20 bg-[#131722]/95 px-4 py-2.5 md:px-5 md:py-3 text-white shadow-2xl backdrop-blur-2xl transition-all duration-200 hover:scale-[1.03] hover:border-amber-400/50 hover:shadow-amber-500/20 active:scale-[0.97] cursor-pointer',
            )}
          >
            <div className="relative flex size-9 md:size-10 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-bold shadow-md group-hover:bg-amber-300 transition-colors">
              <ShoppingBag className="size-4 md:size-5" />
              <span className="absolute -top-1.5 -right-1.5 flex size-4.5 md:size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-[#131722]">
                {count}
              </span>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[10px] md:text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                {eventIds.length} {eventIds.length === 1 ? 'Event' : 'Events'} in Cart
              </span>
              <span className="font-mono text-sm md:text-base font-bold text-white">
                {centsToUSD(grandTotal)}
              </span>
            </div>

            <div className="ml-1 md:ml-2 flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 md:px-3 md:py-1.5 text-xs font-bold text-amber-400 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all">
              <span>View Cart</span>
              <ChevronRight className="size-3.5" />
            </div>
          </button>
        </aside>
      )}

      {/* Slide-Over Universal Cart Drawer */}
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          hideCloseButton={true}
          className="w-full sm:max-w-lg bg-[#0c0f17] border-l border-white/10 text-white flex flex-col p-0 shadow-2xl overflow-hidden backdrop-blur-2xl h-full"
        >
          <SheetTitle className="sr-only">Universal Event Shopping Cart</SheetTitle>

          {/* Drawer Header */}
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

          {/* Cart Item Groups by Event */}
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
                    {/* Event Header Banner */}
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

                    {/* Group Items */}
                    <div className="divide-y divide-white/5 p-2">
                      {groupItems.map((item: UniversalCartItem) => (
                        <div key={item.id} className="flex items-center justify-between p-2 text-xs">
                          <div className="min-w-0 pr-3 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] font-mono uppercase bg-white/5 border-white/15">
                                {item.kind}
                              </Badge>
                              <span className="font-bold text-white truncate">{item.label}</span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-400">
                              {centsToUSD(item.unitPriceCents)} each
                            </p>
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
                              className="text-slate-500 hover:text-rose-400 p-1"
                              aria-label="Remove item"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer with Checkout CTA */}
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

              <Button
                onClick={() => {
                  onCheckout();
                }}
                className="w-full h-12 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans text-sm font-bold tracking-wide shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Proceed to Checkout ({centsToUSD(grandTotal)}) <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
