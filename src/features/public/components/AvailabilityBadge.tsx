import { cn } from '@/shared/lib/cn';

interface AvailabilityBadgeProps {
  quantityLeft?: number;
  maxQuantity?: number;
  className?: string;
}

export function AvailabilityBadge({ quantityLeft, maxQuantity, className }: AvailabilityBadgeProps) {
  const left = quantityLeft;
  const limit = maxQuantity;

  // If it's explicitly sold out (0)
  if (left === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-danger/10 border border-danger/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger', className)}>
        Sold Out
      </span>
    );
  }

  // If quantity left is low
  if (left !== undefined && left <= 10) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-accent-gold/15 border border-accent-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-gold svyne-urgent', className)}>
        Only {left} left
      </span>
    );
  }

  // If inventory is generally low relative to max quantity
  if (left !== undefined && limit !== undefined && limit > 0 && left / limit < 0.25) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-accent-gold/15 border border-accent-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-gold', className)}>
        Selling Fast
      </span>
    );
  }

  return null;
}
