import * as React from 'react';
import { cn } from '@/shared/lib/cn';

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground',
        className,
      )}
      {...props}
    />
  );
}
