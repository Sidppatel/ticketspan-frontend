import * as React from 'react';
import { cn } from '@/shared/lib/cn';

export type SelectProps = React.ComponentProps<'select'>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      data-slot="select"
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-surface px-3.5 py-2 text-sm text-foreground shadow-xs transition-[border-color,box-shadow,background-color] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
