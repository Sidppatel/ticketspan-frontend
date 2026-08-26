import { ShieldCheck, Ticket } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { centsToUSD } from '@/shared/lib/format';
import { lineAllInExclTaxCents, cartServiceFeeCents, quoteCart } from '@/features/public/services/paymentService';
import type { CartQuote, CartQuoteLine } from '@/shared/proto/bookings';
import type { CartItem } from '@/features/public/services/pendingCart';
import { useCartStore, isCartItemExpired, type UniversalCartItem } from '@/shared/lib/cartStore';
import { CartItemCountdown } from '@/features/public/components/cart/CartItemCountdown';
import { toast } from 'sonner';
import { useCallback } from 'react';

interface BentoOrderSummaryProps {
  cart: CartItem[];
  quote: CartQuote | null;
  feesIncluded: boolean;
  busy: boolean;
  bookingError: string | null;
  onRemoveKey: (key: string) => void;
  onCheckout: (method: 'card' | 'ach') => void;
}

export function BentoOrderSummary({
  cart,
  quote,
  feesIncluded,
  busy,
  bookingError,
  onRemoveKey,
  onCheckout,
}: BentoOrderSummaryProps) {
  const { items: cartStoreItems, reclaimItem } = useCartStore();

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
  const total = quote?.totalCents ?? 0;
  const discount = quote?.discountCents ?? 0;
  const achAvailable = quote?.achAvailable ?? false;
  const achTotal = quote?.achTotalCents ?? 0;
  const achSavings = quote?.achSavingsCents ?? 0;

  const hasExpired = cart.some((c) => {
    const storeItem = cartStoreItems.find((i) => `${i.kind}:${i.refId}` === c.key);
    return storeItem ? isCartItemExpired(storeItem) : false;
  });

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-border-strong bg-surface-card shadow-xl rounded-3xl">
        <div className="flex items-center justify-between border-b border-border-soft bg-surface-sunken px-6 py-4">
          <span className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Order Summary</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500">
            <ShieldCheck className="size-4" /> Instant Pass Delivery
          </span>
        </div>

        <CardContent className="p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="space-y-3 py-8 text-center">
              <Ticket className="mx-auto size-10 stroke-1 text-muted-foreground/40" />
              <p className="text-sm font-bold text-foreground">Your pass deck is empty</p>
              <p className="mx-auto max-w-[220px] text-xs leading-relaxed text-muted-foreground">
                Select an event pass on the left to reserve your entry.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-border-soft">
                {cart.map((item) => {
                  const line = quote?.lines?.find((l: CartQuoteLine) => `${l.kind}:${l.refId}` === item.key);
                  const linePrice = feesIncluded
                    ? (line ? lineAllInExclTaxCents(line) : undefined)
                    : line?.breakdown?.sellingPriceCents;
                  const storeItem = cartStoreItems.find((i) => `${i.kind}:${i.refId}` === item.key);

                  return (
                    <div key={item.key} className="py-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 min-w-0 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-wider text-brand">
                              {item.kind}
                            </span>
                            <span className="block max-w-[130px] truncate font-bold text-foreground">{item.label}</span>
                          </div>
                          <span className="block text-muted-foreground">
                            {item.seats} {item.seats === 1 ? 'pass' : 'passes'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-foreground">
                            {linePrice !== undefined ? centsToUSD(linePrice) : '—'}
                          </span>
                          <button
                            className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-destructive hover:underline"
                            onClick={() => onRemoveKey(item.key)}
                            type="button"
                          >
                            Remove
                          </button>
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

              <div className="border-t border-border-strong pt-4 space-y-2">
                <div className="space-y-1.5 text-xs font-medium">
                  {discount > 0 && (
                    <div className="flex justify-between text-success font-bold">
                      <span>{quote?.groupDiscount?.appliedRuleName || 'Savings'}</span>
                      <span className="font-mono">-{centsToUSD(discount)}</span>
                    </div>
                  )}
                  {!feesIncluded && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-mono">{centsToUSD(subtotal)}</span>
                      </div>
                      {serviceFee > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Service fee</span>
                          <span className="font-mono">{centsToUSD(serviceFee)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax</span>
                      <span className="font-mono">{centsToUSD(tax)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border-soft pt-2 text-sm font-extrabold text-foreground">
                    <span>Total</span>
                    <span className="font-mono text-base">{centsToUSD(total)}</span>
                  </div>
                  {achAvailable && achSavings > 0 && (
                    <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-emerald-500 text-xs mt-2">
                      <span className="font-bold">Pay by Bank (ACH)</span>
                      <span className="font-mono font-bold">
                        {centsToUSD(achTotal)} · save {centsToUSD(achSavings)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {bookingError && (
            <div role="alert" className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-xs font-bold leading-normal">
              {bookingError}
            </div>
          )}

          {hasExpired ? (
            <div className="space-y-2">
              <p className="text-center font-mono text-xs text-rose-500 font-semibold">
                Hold timer expired on one or more passes.
              </p>
              <p className="text-center text-[11px] text-muted-foreground">
                Click &quot;Re-claim&quot; on the expired pass above to renew your hold window before checkout.
              </p>
            </div>
          ) : (
            <>
              <Button
                disabled={busy || cart.length === 0 || !quote}
                onClick={() => onCheckout('card')}
                size="lg"
                className="w-full h-12 rounded-2xl bg-brand text-brand-ink font-extrabold text-sm uppercase tracking-wider shadow-md hover:bg-brand-hover active:scale-98 cursor-pointer"
              >
                {busy ? 'Reserving Passes…' : 'Continue to Checkout'}
              </Button>

              {achAvailable && achSavings > 0 && (
                <Button
                  disabled={busy || cart.length === 0 || !quote}
                  onClick={() => onCheckout('ach')}
                  size="lg"
                  variant="outline"
                  className="w-full h-12 rounded-2xl border-emerald-500/30 text-emerald-500 font-bold hover:bg-emerald-500/10 cursor-pointer"
                >
                  {busy ? 'Reserving Passes…' : `Pay by Bank & Save ${centsToUSD(achSavings)}`}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2.5 rounded-3xl border border-border-soft bg-surface-card p-5 text-xs">
        <div className="flex items-center gap-2 font-display text-sm font-bold uppercase text-foreground">
          <ShieldCheck className="size-4 text-emerald-500" /> Ticket Guarantee
        </div>
        <p className="leading-relaxed text-muted-foreground">
          <strong className="text-foreground">100% Authentic Tickets.</strong> Guaranteed valid for entrance, direct to mobile pass wallet.
        </p>
      </div>
    </div>
  );
}
