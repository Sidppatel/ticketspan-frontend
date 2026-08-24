import { Minus, Plus, Ticket, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { PriceBadge } from '../PriceBadge';
import { AvailabilityBadge } from '../AvailabilityBadge';
import { cn } from '@/shared/lib/cn';
import { addCents } from '@/shared/lib/math';
import { centsToUSD } from '@/shared/lib/format';
import type { CartItem } from '@/features/public/services/pendingCart';

interface TicketTypeItem {
  eventTicketTypesId: string;
  label: string;
  description?: string;
  priceCents: number;
  platformFeeCents: number;
  sellingPriceCents: number;
  capacity: number;
  soldCount: number;
  maxQuantity: number;
}

interface TicketPassDeckProps {
  admissionTiers: TicketTypeItem[];
  feesIncluded: boolean;
  achAvailable: boolean;
  cart: CartItem[];
  upsert: (item: CartItem) => void;
  removeKey: (key: string) => void;
}

export function TicketPassDeck({
  admissionTiers,
  feesIncluded,
  achAvailable,
  cart,
  upsert,
  removeKey,
}: TicketPassDeckProps) {
  if (admissionTiers.length === 0) {
    return (
      <div className="rounded-3xl border border-border-soft bg-surface-card p-8 text-center text-sm text-ink-soft">
        No ticket passes on sale right now.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
          <Ticket className="size-5 text-brand" /> Select Passes
        </h3>
        <span className="text-xs font-mono font-medium text-ink-soft uppercase tracking-wider">
          {admissionTiers.length} {admissionTiers.length === 1 ? 'Tier' : 'Tiers'} Available
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {admissionTiers.map((tt, index) => {
          const qty = cart.find((i) => i.key === `Ticket:${tt.eventTicketTypesId}`)?.seats || 0;
          const availableQuantity = tt.capacity > 0 ? Math.max(0, tt.capacity - tt.soldCount) : undefined;
          const isSoldOut = availableQuantity === 0;
          const isPopular = index === 0;

          const displayPrice = feesIncluded ? addCents(tt.priceCents, tt.platformFeeCents) : tt.priceCents;
          const discountedPriceCents = tt.sellingPriceCents > 0 && tt.sellingPriceCents < tt.priceCents ? tt.sellingPriceCents : undefined;
          const displayDiscounted = discountedPriceCents !== undefined
            ? (feesIncluded ? addCents(discountedPriceCents, tt.platformFeeCents) : discountedPriceCents)
            : undefined;

          return (
            <div
              key={tt.eventTicketTypesId}
              className={cn(
                'relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-all duration-300',
                isSoldOut
                  ? 'border-border-soft bg-surface-card/60 opacity-60'
                  : isPopular
                    ? 'border-brand/40 bg-gradient-to-br from-brand/[0.09] via-surface-card to-surface-card shadow-lg hover:-translate-y-1 hover:shadow-xl'
                    : 'border-border-strong bg-surface-card hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg',
              )}
            >
              <div className="absolute left-[-12px] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-r border-border-strong bg-surface-canvas" />
              <div className="absolute right-[-12px] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-l border-border-strong bg-surface-canvas" />

              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg font-bold text-foreground">{tt.label}</span>
                  {isPopular && !isSoldOut && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-brand-ink">
                      <Zap className="size-3" /> Most Popular
                    </span>
                  )}
                </div>

                {tt.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {tt.description}
                  </p>
                )}

                <div className="pt-2 flex items-baseline justify-between">
                  <div>
                    {displayDiscounted !== undefined && displayDiscounted !== displayPrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs text-muted-foreground line-through">
                          {centsToUSD(displayPrice)}
                        </span>
                        <PriceBadge priceCents={displayDiscounted} className="font-mono text-xl font-black text-success" />
                      </div>
                    ) : (
                      <PriceBadge priceCents={displayPrice} className="font-mono text-xl font-black text-foreground" />
                    )}
                    {feesIncluded ? (
                      <span className="text-[10px] text-muted-foreground font-medium block">Fees included</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-medium block">+ fees & tax at checkout</span>
                    )}
                    {achAvailable && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-1">
                        <ShieldCheck className="size-3" /> Bank Transfer Savings
                      </span>
                    )}
                  </div>
                  <AvailabilityBadge quantityLeft={availableQuantity} maxQuantity={tt.maxQuantity || undefined} />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-dashed border-border-soft pt-4 px-2">
                <span className="text-xs font-semibold text-muted-foreground">Select Quantity</span>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={qty <= 0 || isSoldOut}
                    onClick={() => {
                      const key = `Ticket:${tt.eventTicketTypesId}`;
                      if (qty <= 1) {
                        removeKey(key);
                      } else {
                        upsert({
                          key,
                          kind: 'Ticket',
                          refId: tt.eventTicketTypesId,
                          label: tt.label,
                          seats: qty - 1,
                        });
                      }
                    }}
                    className="size-11 rounded-2xl cursor-pointer"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center font-mono text-base font-bold text-foreground">{qty}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      isSoldOut ||
                      (tt.maxQuantity > 0 && qty >= tt.maxQuantity) ||
                      (availableQuantity !== undefined && qty >= availableQuantity)
                    }
                    onClick={() => {
                      const key = `Ticket:${tt.eventTicketTypesId}`;
                      upsert({
                        key,
                        kind: 'Ticket',
                        refId: tt.eventTicketTypesId,
                        label: tt.label,
                        seats: qty + 1,
                      });
                    }}
                    className="size-11 rounded-2xl cursor-pointer bg-brand/10 border-brand/40 text-foreground hover:bg-brand/20"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
