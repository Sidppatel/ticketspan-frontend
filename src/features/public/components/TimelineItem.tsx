import { type ComponentType } from 'react';
import { cn } from '@/shared/lib/cn';

interface TimelineItemProps {
  title: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  typeCategory: string;
  isLeft: boolean;
  styleConfig: {
    ring: string;
    dotBg: string;
    text: string;
    bg: string;
    icon: ComponentType<{ className?: string }>;
  };
}

export function TimelineItem({
  title,
  startTimeFormatted,
  endTimeFormatted,
  typeCategory,
  isLeft,
  styleConfig,
}: TimelineItemProps) {
  const ItemIcon = styleConfig.icon;

  return (
    <div 
      className={cn(
        'relative flex flex-col md:grid md:grid-cols-2 md:gap-16 w-full items-center pl-10 md:pl-0',
        isLeft ? 'md:text-right' : 'md:text-left'
      )}
    >
      {/* Central Node Indicator */}
      <div 
        data-timeline-dot
        className={cn(
          'absolute z-20 size-4 rounded-full border-4 border-background transition-transform duration-300',
          'left-[8px] md:left-1/2 md:-translate-x-1/2 top-[24px] md:top-1/2 md:-translate-y-1/2',
          styleConfig.dotBg
        )}
      />

      {/* Details Card */}
      <div 
        data-timeline-card
        className={cn(
          'w-full rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm transition-all duration-300 md:order-1',
          isLeft ? 'md:col-start-1' : 'md:col-start-2',
          !isLeft && 'md:order-2'
        )}
      >
        <div className={cn('flex flex-col gap-3', isLeft ? 'md:items-end' : 'md:items-start')}>
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
            <span className="tracking-wider uppercase text-accent-burgundy/80">
              {startTimeFormatted} – {endTimeFormatted}
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-md">
              {typeCategory}
            </span>
          </div>
          
          <h3 className="text-base font-black text-ink leading-snug font-display">{title}</h3>
          
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset mt-2',
            styleConfig.bg,
            styleConfig.ring,
            styleConfig.text
          )}>
            <ItemIcon className="size-3.5" />
            {typeCategory}
          </span>
        </div>
      </div>

      {/* Spacer Grid Slot for Desktop layout */}
      <div className="hidden md:block md:order-2" />
    </div>
  );
}
