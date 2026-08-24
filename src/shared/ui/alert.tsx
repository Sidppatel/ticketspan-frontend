import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const alertVariants = cva(
  'relative flex w-full gap-3 rounded-xl border p-4 text-sm leading-relaxed transition-colors [&>svg]:size-5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-foreground [&>svg]:text-foreground',
        destructive:
          'border-destructive/30 bg-destructive/5 text-destructive [&>svg]:text-destructive',
        success:
          'border-success/30 bg-success/5 text-success [&>svg]:text-success',
        warning:
          'border-warning/30 bg-warning/5 text-warning [&>svg]:text-warning',
        info: 'border-primary/30 bg-primary/5 text-foreground [&>svg]:text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
}

export function Alert({ className, variant, icon, children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon}
      <div className="flex-1 space-y-1">{children}</div>
    </div>
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn('font-display font-semibold leading-tight tracking-tight text-foreground', className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('text-xs opacity-90 sm:text-sm', className)}
      {...props}
    />
  );
}
