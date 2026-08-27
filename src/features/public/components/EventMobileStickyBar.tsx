import { useState, useCallback } from 'react';
import { Ticket, ShoppingBag, ChevronUp, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { PriceBadge } from './PriceBadge';
import { centsToUSD } from '@/shared/lib/format';
import { lineAllInExclTaxCents, cartServiceFeeCents, quoteCart } from '@/features/public/services/paymentService';
import type { CartQuote, CartQuoteLine } from '@/shared/proto/bookings';
import type { CartItem } from '@/features/public/services/pendingCart';
import { useCartStore, isCartItemExpired, type UniversalCartItem } from '@/shared/lib/cartStore';
import { CartItemCountdown } from '@/features/public/components/cart/CartItemCountdown';
import { toast } from 'sonner';

interface EventMobileStickyBarProps {
  minPriceCents?: number;
  cartCount: number;
  totalCents: number;
  busy: boolean;
  onGetTickets: () => void;
  onCheckout: () => void;
  cart?: CartItem[];
  quote?: CartQuote | null;
  feesIncluded?: boolean;
  onRemoveKey?: (key: string) => void;
}

export function EventMobileStickyBar({
  minPriceCents,
  cartCount,
  totalCents,
  busy,
  onGetTickets,
  onCheckout,
  cart = [],
  quote,
  feesIncluded = false,
  onRemoveKey,
}: EventMobileStickyBarProps) {
  const { items: cartStoreItems, reclaimItem } = useCartStore();
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

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

  const subtotal = quote?.subtotalCents ?? 0;
  const serviceFee = quote ? cartServiceFeeCents(quote) : 0;
  const tax = quote?.taxCents ?? 0;
  const total = quote?.totalCents ?? totalCents;
  const discount = quote?.discountCents ?? 0;
  const achAvailable = quote?.achAvailable ?? false;
  const achSavings = quote?.achSavingsCents ?? 0;

  const hasExpired = cart.some((c) => {
    const storeItem = cartStoreItems.find((i) => `${i.kind}:${i.refId}` === c.key);
    return storeItem ? isCartItemExpired(storeItem) : false;
  });

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-strong bg-surface-canvas/95 px-4 py-3 shadow-lg backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (cartCount > 0) setIsBreakdownOpen(true);
            }}
            disabled={cartCount === 0}
            className="flex flex-col text-left group cursor-pointer focus:outline-none"
          >
            {cartCount > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-ink-soft">
                    {cartCount} {cartCount === 1 ? 'ticket' : 'tickets'} selected
                  </span>
                  <span className="text-[10px] font-bold text-brand hover:underline flex items-center gap-0.5">
                    · View breakdown <ChevronUp className="size-3 transition-transform group-hover:-translate-y-0.5" />
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-foreground">{centsToUSD(total)}</span>
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase tracking-wider text-ink-soft">Starting from</span>
                {minPriceCents !== undefined ? (
                  <PriceBadge priceCents={minPriceCents} className="font-mono text-base font-bold text-foreground" />
                ) : (
                  <span className="text-xs font-semibold text-ink-soft">Check pricing</span>
                )}
              </>
            )}
          </button>

          {cartCount > 0 ? (
            <Button
              onClick={onCheckout}
              disabled={busy}
              size="lg"
              className="flex-1 max-w-[200px] gap-2 rounded-xl bg-brand text-brand-ink font-bold shadow-md hover:bg-brand-hover active:scale-98"
            >
              <ShoppingBag className="size-4" />
              {busy ? 'Reserving…' : 'Checkout'}
            </Button>
          ) : (
            <Button
              onClick={onGetTickets}
              size="lg"
              className="flex-1 max-w-[200px] gap-2 rounded-xl bg-foreground text-background font-bold shadow-md hover:bg-foreground/90 active:scale-98"
            >
              <Ticket className="size-4 text-brand" />
              Get Tickets
            </Button>
          )}
        </div>
      </div>

      {}
      <Sheet open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
        <SheetContent
          side="bottom"
          hideCloseButton={true}
          className="border-t border-border-strong bg-surface-card text-foreground p-0 rounded-t-3xl shadow-2xl overflow-hidden"
        >
          <SheetTitle className="sr-only">Order Summary & Fee Breakdown</SheetTitle>

          {}
          <div className="flex items-center justify-between border-b border-border-soft bg-surface-sunken px-6 py-4">
            <span className="font-display text-base font-bold uppercase tracking-wider text-foreground">
              Order Summary
            </span>
            <button
              type="button"
              onClick={() => setIsBreakdownOpen(false)}
              className="flex size-7 items-center justify-center rounded-full bg-surface-card border border-border-soft text-muted-foreground hover:text-foreground"
              aria-label="Close summary"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {}
            <div className="divide-y divide-border-soft border-b border-border-soft pb-3">
              {cart.map((item) => {
                const line = quote?.lines?.find((l: CartQuoteLine) => `${l.kind}:${l.refId}` === item.key);
                const linePrice = feesIncluded
                  ? (line ? lineAllInExclTaxCents(line) : undefined)
                  : line?.breakdown?.sellingPriceCents;
                const storeItem = cartStoreItems.find((i) => `${i.kind}:${i.refId}` === item.key);

                return (
                  <div key={item.key} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-wider text-brand">
                            {item.kind}
                          </span>
                          <span className="truncate font-bold text-foreground">{item.label}</span>
                        </div>
                        <span className="block text-muted-foreground text-[11px]">
                          {item.seats} {item.seats === 1 ? 'pass' : 'passes'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-bold text-foreground">
                          {linePrice !== undefined ? centsToUSD(linePrice) : '—'}
                        </span>
                        {onRemoveKey && (
                          <button
                            type="button"
                            className="text-xs font-semibold text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
                            onClick={() => onRemoveKey(item.key)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {storeItem && (
                      <div className="pt-0.5">
                        <CartItemCountdown item={storeItem} onReclaim={handleReclaim} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {}
            <div className="space-y-2 text-xs">
              {discount > 0 && (
                <div className="flex justify-between text-emerald-500 font-bold">
                  <span>{quote?.groupDiscount?.appliedRuleName || 'Savings'}</span>
                  <span className="font-mono">-{centsToUSD(discount)}</span>
                </div>
              )}

              {!feesIncluded && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                    <span className="font-mono font-semibold text-foreground">{centsToUSD(subtotal)}</span>
                  </div>
                  {serviceFee > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Service fee</span>
                      <span className="font-mono font-semibold text-foreground">{centsToUSD(serviceFee)}</span>
                    </div>
                  )}
                </>
              )}

              {tax > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span className="font-mono font-semibold text-foreground">{centsToUSD(tax)}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border-strong pt-3 text-base font-extrabold text-foreground">
                <span>Total</span>
                <span className="font-mono text-lg text-brand">{centsToUSD(total)}</span>
              </div>

              {achAvailable && achSavings > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-emerald-500 text-xs mt-2 font-mono">
                  <span className="font-bold flex items-center gap-1">
                    <ShieldCheck className="size-3.5" /> Pay by Bank (ACH)
                  </span>
                  <span className="font-bold">Save {centsToUSD(achSavings)}</span>
                </div>
              )}
            </div>

            {}
            {hasExpired ? (
              <div className="space-y-2 pt-2">
                <p className="text-center font-mono text-xs text-rose-500 font-semibold">
                  Hold timer expired on one or more passes.
                </p>
                <p className="text-center text-[11px] text-muted-foreground">
                  Please re-claim expired passes above to restart your hold window before checkout.
                </p>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setIsBreakdownOpen(false);
                  onCheckout();
                }}
                disabled={busy}
                size="lg"
                className="w-full h-12 rounded-2xl bg-brand text-brand-ink font-bold text-sm uppercase tracking-wider shadow-md hover:bg-brand-hover active:scale-98 cursor-pointer"
              >
                {busy ? 'Reserving…' : `Proceed to Checkout (${centsToUSD(total)})`}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
