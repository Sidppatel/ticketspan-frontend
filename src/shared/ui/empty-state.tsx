import * as React from 'react';
import { cn } from '@/shared/lib/cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center sm:p-12',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-xs [&_svg]:size-6">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
