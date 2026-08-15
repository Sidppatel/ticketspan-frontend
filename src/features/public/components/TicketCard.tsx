import { Minus, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { PriceBadge } from './PriceBadge';
import { AvailabilityBadge } from './AvailabilityBadge';
import { cn } from '@/shared/lib/cn';
import { addCents } from '@/shared/lib/math';
import { centsToUSD } from '@/shared/lib/format';

interface TicketCardProps {
  label: string;
  description?: string;
  priceCents: number;
  platformFeeCents: number;
  feesIncluded: boolean;
  quantity: number;
  maxQuantity?: number;
  availableQuantity?: number;
  isPopular?: boolean;
  onQuantityChange: (qty: number) => void;
  discountedPriceCents?: number;
  achAvailable?: boolean;
}

export function TicketCard({
  label,
  description,
  priceCents,
  platformFeeCents,
  feesIncluded,
  quantity: qty,
  maxQuantity,
  availableQuantity,
  isPopular = false,
  onQuantityChange,
  discountedPriceCents,
  achAvailable = false,
}: TicketCardProps) {
  const isSoldOut = availableQuantity === 0;

  const displayPrice = feesIncluded ? addCents(priceCents, platformFeeCents) : priceCents;
  const displayDiscounted =
    discountedPriceCents !== undefined
      ? feesIncluded
        ? addCents(discountedPriceCents, platformFeeCents)
        : discountedPriceCents
      : undefined;

  return (
    <div
      data-ticket-tier-card
      className={cn(
        'relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-4 sm:p-5 backdrop-blur-md transition-all duration-200 sm:flex-row sm:items-center sm:justify-between',
        isSoldOut
          ? 'border-border-soft bg-surface-card/60 opacity-60'
          : isPopular
            ? 'border-brand/40 bg-gradient-to-br from-brand/[0.08] via-surface-card to-surface-card shadow-md hover:-translate-y-0.5 hover:shadow-lg'
            : 'border-border-soft bg-surface-card hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md',
      )}
    >
      <div
        className="absolute left-[-8px] top-1/2 hidden h-4 w-4 -translate-y-1/2 rounded-full border-r border-border-strong bg-background sm:block"
      />
      <div
        className="absolute right-[-8px] top-1/2 hidden h-4 w-4 -translate-y-1/2 rounded-full border-l border-border-strong bg-background sm:block"
      />

      <div className="relative min-w-0 flex-1 space-y-1.5 sm:pl-2">
        {isPopular && !isSoldOut && (
          <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-ink">
            Most popular
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-bold leading-tight text-foreground sm:text-lg">
            {label}
          </span>
          <AvailabilityBadge quantityLeft={availableQuantity} maxQuantity={maxQuantity} />
        </div>

        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 sm:max-w-md">
            {description}
          </p>
        )}

        <div className="pt-1">
          {displayDiscounted !== undefined && displayDiscounted !== displayPrice ? (
            <span className="inline-flex items-baseline gap-2">
              <span className="font-mono text-xs text-muted-foreground line-through">
                {centsToUSD(displayPrice)}
              </span>
              <PriceBadge priceCents={displayDiscounted} className="font-mono text-base font-bold text-success" />
            </span>
          ) : (
            <PriceBadge priceCents={displayPrice} className="font-mono text-base font-bold text-foreground" />
          )}

          {feesIncluded && (
            <span className="ml-2 text-[10px] font-medium text-muted-foreground">
              (fees included)
            </span>
          )}

          {achAvailable && (
            <span className="block text-[11px] font-semibold text-success mt-0.5">
              Pay by bank (ACH) to lower transaction fee
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-dashed border-border-soft pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
        <span className="text-xs font-semibold text-muted-foreground sm:hidden">Quantity</span>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label={`Remove one ${label} ticket`}
            disabled={qty <= 0 || isSoldOut}
            onClick={() => onQuantityChange(qty - 1)}
            className="size-10 cursor-pointer rounded-xl"
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-8 text-center font-mono text-base font-bold text-foreground">{qty}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label={`Add one ${label} ticket`}
            disabled={
              isSoldOut ||
              (maxQuantity !== undefined && qty >= maxQuantity) ||
              (availableQuantity !== undefined && qty >= availableQuantity)
            }
            onClick={() => onQuantityChange(qty + 1)}
            className="size-10 cursor-pointer rounded-xl bg-brand/10 border-brand/30 text-foreground hover:bg-brand/20"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
