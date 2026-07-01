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
  availableQuantity?: number; // actual stock remaining
  isPopular?: boolean;
  onQuantityChange: (qty: number) => void;
  discountedPriceCents?: number;
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
        'relative flex items-center justify-between rounded-2xl border p-5 overflow-hidden transition-all duration-300 bg-surface-card',
        isSoldOut 
          ? 'opacity-65 border-border-soft' 
          : isPopular
            ? 'border-accent-burgundy/40 bg-gradient-to-r from-surface-card to-accent-burgundy/[0.02] shadow-md hover:shadow-lg'
            : 'border-border-strong hover:border-accent-burgundy/20 shadow-sm hover:shadow-md'
      )}
    >
      {/* Ticket Stub Perforation Notches */}
      <div 
        className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-r border-border-strong"
        style={{ '--svyne-notch': 'var(--background)' } as React.CSSProperties}
      />
      <div 
        className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-l border-border-strong"
        style={{ '--svyne-notch': 'var(--background)' } as React.CSSProperties}
      />

      <div className="pl-3 pr-4 relative min-w-0 flex-1">
        {isPopular && !isSoldOut && (
          <span className="inline-flex items-center gap-1 rounded bg-accent-burgundy text-[8px] font-black uppercase tracking-wider text-white px-2 py-0.5 mb-2 border border-accent-burgundy/20 shadow-sm">
            ★ Recommended Choice
          </span>
        )}
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="block font-black text-lg text-foreground font-display tracking-tight leading-tight">
            {label}
          </span>
          <AvailabilityBadge quantityLeft={availableQuantity} maxQuantity={maxQuantity} />
        </div>

        {description && (
          <span className="block text-xs text-muted-foreground mt-1 max-w-[200px] sm:max-w-md truncate">
            {description}
          </span>
        )}

        <span className="block text-sm font-black mt-2">
          {displayDiscounted !== undefined && displayDiscounted !== displayPrice ? (
            <span className="inline-flex items-baseline gap-2">
              <span className="line-through text-muted-foreground/60 text-xs font-semibold font-display">
                {centsToUSD(displayPrice)}
              </span>
              <PriceBadge priceCents={displayDiscounted} className="text-emerald-500 font-extrabold text-sm" />
            </span>
          ) : (
            <PriceBadge priceCents={displayPrice} className="text-accent-gold font-extrabold text-sm" />
          )}
          <span className="text-[10px] text-muted-foreground font-semibold"> each</span>
          {!feesIncluded && platformFeeCents > 0 && (
            <span className="text-[9px] text-muted-foreground font-medium block sm:inline">
              {' '}(+ <PriceBadge priceCents={platformFeeCents} /> service fee)
            </span>
          )}
        </span>
      </div>

      {/* Perforation vertical separation line and controls */}
      <div className="flex items-center gap-2 border-l border-dashed border-border-strong pl-6 py-4 relative shrink-0">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={qty <= 0 || isSoldOut}
          onClick={() => onQuantityChange(qty - 1)}
          className="size-9 rounded-xl border-border-strong hover:border-accent-burgundy hover:bg-accent-burgundy hover:text-white transition-all duration-200 active:scale-90 font-black cursor-pointer"
        >
          <Minus className="size-3.5" />
        </Button>
        <div className="w-8 text-center font-black text-sm text-foreground select-none font-display">
          {qty}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSoldOut || (maxQuantity !== undefined && qty >= maxQuantity) || (availableQuantity !== undefined && qty >= availableQuantity)}
          onClick={() => onQuantityChange(qty + 1)}
          className="size-9 rounded-xl border-border-strong hover:border-accent-burgundy hover:bg-accent-burgundy hover:text-white transition-all duration-200 active:scale-90 font-black cursor-pointer"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
