import { useCallback, useRef, type ComponentType } from 'react';
import { CalendarClock, Award, Flame, Coffee, Radio, HelpCircle } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listScheduleItems } from '@/features/public/services/publicEventService';
import { formatEpoch } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const TYPE_STYLES: Record<string, { ring: string; dotBg: string; text: string; bg: string; icon: ComponentType<{ className?: string }> }> = {
  Performance: {
    ring: 'ring-primary/20',
    dotBg: 'bg-primary shadow-[0_0_10px_rgba(164,18,63,0.5)]',
    text: 'text-primary',
    bg: 'bg-primary/5',
    icon: Flame,
  },
  Break: {
    ring: 'ring-amber/20',
    dotBg: 'bg-amber-500 shadow-[0_0_10px_rgba(245,165,36,0.5)]',
    text: 'text-amber-600',
    bg: 'bg-amber-500/5',
    icon: Coffee,
  },
  Intermission: {
    ring: 'ring-muted',
    dotBg: 'bg-body/50',
    text: 'text-body',
    bg: 'bg-muted/30',
    icon: Coffee,
  },
  'DJ Set': {
    ring: 'ring-success/20',
    dotBg: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    text: 'text-success',
    bg: 'bg-success/5',
    icon: Radio,
  },
  Networking: {
    ring: 'ring-primary/10',
    dotBg: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]',
    text: 'text-indigo-600',
    bg: 'bg-indigo-500/5',
    icon: Award,
  },
  Other: {
    ring: 'ring-border',
    dotBg: 'bg-muted-foreground/50',
    text: 'text-muted-foreground',
    bg: 'bg-muted/25',
    icon: HelpCircle,
  },
};

export function EventTimeline({ eventsId }: { eventsId: string }) {
  const loader = useCallback(() => listScheduleItems(eventsId), [eventsId]);
  const { data } = useAsync(loader);
  const items = data ?? [];

  const timelineRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!timelineRef.current || !progressBarRef.current || items.length === 0) return;

      const timeline = timelineRef.current;
      const progressBar = progressBarRef.current;
      const timelineCards = timeline.querySelectorAll('[data-timeline-card]');

      // 1. Scroll-driven Line Drawing Animation
      gsap.fromTo(
        progressBar,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: timeline,
            start: 'top 75%',
            end: 'bottom 60%',
            scrub: true,
          },
        }
      );

      // 2. Timeline Card Stagger Enter
      gsap.from(timelineCards, {
        opacity: 0,
        x: (index) => (index % 2 === 0 ? -30 : 30), // alternate sides entry
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
      });

      // 3. Card Hover Elevation Animation
      timelineCards.forEach((card) => {
        const dot = card.querySelector('[data-timeline-dot]');
        
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.02,
            borderColor: 'var(--primary)',
            backgroundColor: 'rgba(164,18,63,0.02)',
            duration: 0.3,
            ease: 'power2.out',
          });
          if (dot) {
            gsap.to(dot, {
              scale: 1.4,
              duration: 0.3,
            });
          }
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card)',
            duration: 0.4,
            ease: 'power2.out',
          });
          if (dot) {
            gsap.to(dot, {
              scale: 1,
              duration: 0.4,
            });
          }
        });
      });
    },
    { scope: timelineRef, dependencies: [items] }
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <section ref={timelineRef} className="space-y-12 py-8">
      {/* Editorial Header */}
      <div className="flex items-center gap-3 border-b border-hairline-strong pb-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <CalendarClock className="size-5" />
        </span>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-ink uppercase font-display">
            Event Schedule
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            Plan your day around these high-impact sessions
          </p>
        </div>
      </div>

      {/* Alternating Pinned Timeline Wrapper */}
      <div className="relative">
        
        {/* Central timeline Track (Dashed Static Background, hidden on mobile, centered on desktop) */}
        <div className="absolute left-[15px] md:left-1/2 top-4 bottom-4 w-[2px] md:-translate-x-1/2 bg-dashed border-l border-hairline-strong" />
        
        {/* Active Drawing Progress Line (Centered on desktop) */}
        <div 
          ref={progressBarRef}
          className="absolute left-[15px] md:left-1/2 top-4 bottom-4 w-[2px] md:-translate-x-1/2 bg-gradient-to-b from-primary via-marigold to-primary origin-top scale-y-0 z-10" 
        />

        <div className="space-y-10 md:space-y-16">
          {items.map((item, index) => {
            const style = TYPE_STYLES[item.typeCategory] ?? TYPE_STYLES.Other;
            const ItemIcon = style.icon;
            const isLeft = index % 2 === 0;

            return (
              <div 
                key={item.scheduleItemsId}
                className={cn(
                  "relative flex flex-col md:grid md:grid-cols-2 md:gap-16 w-full items-center pl-10 md:pl-0",
                  isLeft ? "md:text-right" : "md:text-left"
                )}
              >
                {/* Glowing Node Point Indicator (Positioned centered on desktop track) */}
                <div 
                  data-timeline-dot
                  className={cn(
                    'absolute z-20 size-4 rounded-full border-4 border-background transition-transform duration-300',
                    'left-[8px] md:left-1/2 md:-translate-x-1/2 top-[24px] md:top-1/2 md:-translate-y-1/2',
                    style.dotBg
                  )}
                />

                {/* Left Side Content Placement */}
                <div 
                  data-timeline-card
                  className={cn(
                    "w-full rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm transition-all duration-300 md:order-1",
                    isLeft ? "md:col-start-1" : "md:col-start-2",
                    !isLeft && "md:order-2"
                  )}
                >
                  <div className={cn("flex flex-col gap-3", isLeft ? "md:items-end" : "md:items-start")}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold tracking-wider uppercase text-primary/75">
                        {formatEpoch(item.startTime)} – {formatEpoch(item.endTime)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 font-semibold">•</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-md">
                        {item.typeCategory}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-ink leading-snug font-display">{item.title}</h3>
                    
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset mt-2',
                        style.bg,
                        style.ring,
                        style.text
                      )}
                    >
                      <ItemIcon className="size-3.5" />
                      {item.typeCategory}
                    </span>
                  </div>
                </div>

                {/* Empty Grid Cell for spacing on the opposite side (Only on desktop) */}
                <div className="hidden md:block md:order-2" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
