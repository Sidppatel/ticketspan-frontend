import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs',
        secondary: 'bg-secondary/15 text-secondary border border-secondary/30',
        neutral: 'bg-muted text-foreground border border-border',
        success: 'bg-success/15 text-success border border-success/30',
        warn: 'bg-warning/15 text-warning border border-warning/30',
        danger: 'bg-destructive/15 text-destructive border border-destructive/30',
        voltage: 'bg-marigold/20 text-foreground border border-marigold/40 font-mono',
        outline: 'border border-border text-foreground bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
