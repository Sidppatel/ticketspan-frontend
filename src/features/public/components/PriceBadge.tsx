import { centsToUSD } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface PriceBadgeProps {
  priceCents: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function PriceBadge({ priceCents, className, prefix = '', suffix = '' }: PriceBadgeProps) {
  return (
    <span className={cn('font-display font-bold text-voltage-ink tracking-tight', className)}>
      {prefix}
      {centsToUSD(priceCents)}
      {suffix}
    </span>
  );
}
