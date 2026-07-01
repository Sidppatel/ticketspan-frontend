import { type ComponentType } from 'react';
import { cn } from '@/shared/lib/cn';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  light?: boolean;
  className?: string;
}

export function SectionTitle({ title, subtitle, icon: Icon, light = false, className }: SectionTitleProps) {
  return (
    <div className={cn('space-y-2 pb-4 border-b', light ? 'border-border-soft' : 'border-border-strong', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={cn(
            'flex size-10 items-center justify-center rounded-xl border',
            light 
              ? 'bg-white/5 text-white border-white/10' 
              : 'bg-accent-burgundy/10 text-accent-burgundy border-accent-burgundy/20'
          )}>
            <Icon className="size-5" />
          </span>
        )}
        <h2 className={cn(
          'text-2xl md:text-3xl font-black tracking-tighter uppercase font-display',
          light ? 'text-white' : 'text-foreground'
        )}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className={cn(
          'text-xs font-medium',
          light ? 'text-white/60' : 'text-muted-foreground'
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
