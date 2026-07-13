import { useCallback, useRef, type ComponentType } from 'react';
import { CalendarClock, Award, Flame, Coffee, Radio, HelpCircle } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listScheduleItems } from '@/features/public/services/publicEventService';
import { formatEpoch } from '@/shared/lib/format';
import { resolveCssColor } from '@/shared/theme/branding';
import { TimelineItem } from './TimelineItem';
import { SectionTitle } from './SectionTitle';
import { useLazyGsap } from '@/shared/motion/useLazyGsap';

const TYPE_STYLES: Record<string, { ring: string; dotBg: string; text: string; bg: string; icon: ComponentType<{ className?: string }> }> = {
  Performance: {
    ring: 'ring-accent-burgundy/20',
    dotBg: 'bg-accent-burgundy shadow-[0_0_10px_color-mix(in_srgb,var(--brand)_50%,transparent)]',
    text: 'text-accent-burgundy',
    bg: 'bg-accent-burgundy/5',
    icon: Flame,
  },
  Break: {
    ring: 'ring-accent-gold/20',
    dotBg: 'bg-accent-gold shadow-[0_0_10px_color-mix(in_srgb,var(--voltage-accent)_50%,transparent)]',
    text: 'text-accent-gold-foreground',
    bg: 'bg-accent-gold/5',
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
    dotBg: 'bg-success shadow-[0_0_10px_color-mix(in_srgb,var(--success)_50%,transparent)]',
    text: 'text-success',
    bg: 'bg-success/5',
    icon: Radio,
  },
  Networking: {
    ring: 'ring-accent-burgundy/10',
    dotBg: 'bg-primary shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_50%,transparent)]',
    text: 'text-primary',
    bg: 'bg-primary/5',
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

  useLazyGsap(
    ({ gsap, ScrollTrigger }) => {
      if (!timelineRef.current || !progressBarRef.current || items.length === 0) return;

      const timeline = timelineRef.current;
      const progressBar = progressBarRef.current;
      const timelineCards = timeline.querySelectorAll('[data-timeline-card]');

      
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

        
        gsap.fromTo(timelineCards, 
          {
            opacity: 0,
            x: (index) => (index % 2 === 0 ? -25 : 25),
          },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: timeline,
              start: 'top 80%',
            }
          }
        );
        
        
        setTimeout(() => ScrollTrigger.refresh(), 100);
      }

      
      timelineCards.forEach((card) => {
        const dot = card.closest('[key]')?.querySelector('[data-timeline-dot]');
        
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.01,
            borderColor: 'var(--accent-burgundy)',
            backgroundColor: resolveCssColor('--brand', 0.02),
            duration: 0.25,
            ease: 'power2.out',
          });
          if (dot) {
            gsap.to(dot, {
              scale: 1.25,
              duration: 0.25,
            });
          }
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card)',
            duration: 0.35,
            ease: 'power2.out',
          });
          if (dot) {
            gsap.to(dot, {
              scale: 1,
              duration: 0.35,
            });
          }
        });
      });
    },
    timelineRef,
    [items],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <section ref={timelineRef} className="space-y-8 py-8" aria-label="Event Schedule">
      <SectionTitle
        title="Event Schedule"
        subtitle="Plan your day around these high-impact sessions"
        icon={CalendarClock}
      />

      <div className="relative">
        {}
        <div className="absolute left-[15px] md:left-1/2 top-4 bottom-4 w-[2px] md:-translate-x-1/2 bg-dashed border-l border-border-strong" />
        
        {}
        <div 
          ref={progressBarRef}
          className="absolute left-[15px] md:left-1/2 top-4 bottom-4 w-[2px] md:-translate-x-1/2 bg-gradient-to-b from-accent-burgundy via-accent-gold to-accent-burgundy origin-top scale-y-0 z-10" 
        />

        <div className="space-y-8 md:space-y-12">
          {items.map((item, index) => {
            const style = TYPE_STYLES[item.typeCategory] || TYPE_STYLES.Other;
            const isLeft = index % 2 === 0;

            return (
              <div key={item.scheduleItemsId}>
                <TimelineItem
                  title={item.title}
                  startTimeFormatted={formatEpoch(item.startTime)}
                  endTimeFormatted={formatEpoch(item.endTime)}
                  typeCategory={item.typeCategory}
                  isLeft={isLeft}
                  styleConfig={style}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
