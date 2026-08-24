import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      neutral: 'bg-surface-sunken text-ink border border-hairline',
      success: 'bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700',
      warn: 'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700',
      danger: 'bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700',
      voltage: 'bg-stone-900 text-white border border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
