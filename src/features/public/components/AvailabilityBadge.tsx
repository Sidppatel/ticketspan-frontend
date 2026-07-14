import { cn } from '@/shared/lib/cn';

interface AvailabilityBadgeProps {
  quantityLeft?: number;
  maxQuantity?: number;
  className?: string;
}

export function AvailabilityBadge({ quantityLeft, maxQuantity, className }: AvailabilityBadgeProps) {
  const left = quantityLeft;
  const limit = maxQuantity;

  if (left === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-danger/10 border border-danger/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger', className)}>
        Sold Out
      </span>
    );
  }

  if (left !== undefined && left <= 10) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-accent-gold/15 border border-accent-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-gold entryvine-urgent', className)}>
        Only {left} left
      </span>
    );
  }

  if (left !== undefined && limit !== undefined && limit > 0 && left / limit < 0.25) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-accent-gold/15 border border-accent-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-gold', className)}>
        Selling Fast
      </span>
    );
  }

  return null;
}
