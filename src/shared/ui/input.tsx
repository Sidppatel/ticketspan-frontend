import * as React from 'react';
import { cn } from '@/shared/lib/cn';

export type InputProps = React.ComponentProps<'input'>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      className={cn(
        'flex h-10 w-full rounded-sm border border-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ticketspan-spring-input',
        className,
      )}
      {...props}
    />
  );
}
