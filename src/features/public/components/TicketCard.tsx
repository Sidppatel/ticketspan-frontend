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
  const displayDiscounted = discountedPriceCents !== undefined
    ? (feesIncluded ? addCents(discountedPriceCents, platformFeeCents) : discountedPriceCents)
    : undefined;

  return (
    <div
      data-ticket-tier-card
      className={cn(
        'relative flex items-center justify-between overflow-hidden rounded-lg border bg-surface p-5 transition-[border-color,box-shadow,transform] duration-[280ms] ease-[var(--ease-out)]',
        isSoldOut
          ? 'border-hairline opacity-60'
          : isPopular
            ? 'border-brand/40 shadow-[var(--shadow-e1)] hover:shadow-[var(--shadow-e2)]'
            : 'border-hairline hover:border-hairline-strong hover:shadow-[var(--shadow-e1)]',
      )}
    >
      {}
      <div 
        className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-r border-border-strong"
        style={{ '--entryvine-notch': 'var(--background)' } as React.CSSProperties}
      />
      <div 
        className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-l border-border-strong"
        style={{ '--entryvine-notch': 'var(--background)' } as React.CSSProperties}
      />

      <div className="pl-3 pr-4 relative min-w-0 flex-1">
        {isPopular && !isSoldOut && (
          <span className="mb-2 inline-flex items-center rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-ink">
            Most popular
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="block font-display text-lg font-semibold leading-tight text-foreground">
            {label}
          </span>
          <AvailabilityBadge quantityLeft={availableQuantity} maxQuantity={maxQuantity} />
        </div>

        {description && (
          <span className="block text-xs text-muted-foreground mt-1 max-w-[200px] sm:max-w-md truncate">
            {description}
          </span>
        )}

        <span className="mt-2 block font-mono text-sm font-medium">
          {displayDiscounted !== undefined && displayDiscounted !== displayPrice ? (
            <span className="inline-flex items-baseline gap-2">
              <span className="text-xs text-ink-faint line-through">{centsToUSD(displayPrice)}</span>
              <PriceBadge priceCents={displayDiscounted} className="text-sm font-medium text-success" />
            </span>
          ) : (
            <PriceBadge priceCents={displayPrice} className="text-sm font-medium text-ink" />
          )}
          <span className="font-sans text-xs text-ink-soft"> each</span>
          {!feesIncluded && platformFeeCents > 0 && (
            <span className="block font-sans text-xs text-ink-soft sm:inline">
              {' '}(+ <PriceBadge priceCents={platformFeeCents} /> service fee)
            </span>
          )}
          {achAvailable && (
            <span className="block font-sans text-xs font-semibold text-success">
              Lower fee when you pay by bank (ACH)
            </span>
          )}
        </span>
      </div>

      <div className="relative flex shrink-0 items-center gap-2 border-l border-dashed border-hairline-strong py-4 pl-6">
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={`Remove one ${label} ticket`}
          disabled={qty <= 0 || isSoldOut}
          onClick={() => onQuantityChange(qty - 1)}
          className="size-11 cursor-pointer"
        >
          <Minus className="size-3.5" />
        </Button>
        <div className="w-8 select-none text-center font-mono text-sm font-medium text-foreground">{qty}</div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={`Add one ${label} ticket`}
          disabled={isSoldOut || (maxQuantity !== undefined && qty >= maxQuantity) || (availableQuantity !== undefined && qty >= availableQuantity)}
          onClick={() => onQuantityChange(qty + 1)}
          className="size-11 cursor-pointer"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
