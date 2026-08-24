import * as React from 'react';
import { cn } from '@/shared/lib/cn';

const MAX_TILT_DEG = 3.5;

export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (!window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const rotateX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -MAX_TILT_DEG;
    const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * MAX_TILT_DEG;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    card.style.boxShadow = 'var(--shadow-e2)';
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
    card.style.boxShadow = '';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow]',
        interactive
          ? 'cursor-pointer shadow-[var(--shadow-e1)] hover:border-primary/40 hover:shadow-[var(--shadow-e2)] transition-[transform,box-shadow,border-color] duration-[280ms] ease-[var(--ease-spring)]'
          : '',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-5 sm:p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-display text-lg font-bold leading-tight tracking-tight text-card-foreground sm:text-xl',
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-muted-foreground leading-relaxed sm:text-sm', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 sm:p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center p-5 sm:p-6 pt-0 border-t border-border/40 mt-auto', className)}
      {...props}
    />
  );
}

