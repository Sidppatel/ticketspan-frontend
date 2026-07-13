import { useMemo, useRef } from 'react';
import { Info, Sparkles, HelpCircle, Lock, Calendar, Star, Compass } from 'lucide-react';
import { parseMeta, publicMeta } from './catalogJson';
import { resolveCssColor } from '@/shared/theme/branding';
import { useLazyGsap } from '@/shared/motion/useLazyGsap';

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}


function getMetaIcon(key: string) {
  const k = key.toLowerCase();
  if (k.includes('age') || k.includes('restriction')) return Lock;
  if (k.includes('dress') || k.includes('attire')) return Sparkles;
  if (k.includes('parking') || k.includes('transport')) return Compass;
  if (k.includes('refund') || k.includes('cancel')) return Star;
  if (k.includes('date') || k.includes('time')) return Calendar;
  return HelpCircle;
}

export function EventExtraInfo({ extraInfoJson }: { extraInfoJson: string }) {
  const items = useMemo(() => publicMeta(parseMeta(extraInfoJson)), [extraInfoJson]);
  const containerRef = useRef<HTMLDivElement>(null);

  useLazyGsap(
    ({ gsap }) => {
      if (!containerRef.current || items.length === 0) return;
      const rows = containerRef.current.querySelectorAll('[data-info-row]');

      
      gsap.from(rows, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      });

      
      rows.forEach((row) => {
        const iconContainer = row.querySelector('[data-info-icon-container]');
        
        row.addEventListener('mouseenter', () => {
          gsap.to(row, {
            borderColor: 'var(--primary)',
            backgroundColor: resolveCssColor('--brand', 0.02),
            x: 5,
            duration: 0.3,
            ease: 'power2.out',
          });
          if (iconContainer) {
            gsap.to(iconContainer, {
              scale: 1.15,
              rotate: 15,
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              duration: 0.3,
            });
          }
        });

        row.addEventListener('mouseleave', () => {
          gsap.to(row, {
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card)',
            x: 0,
            duration: 0.4,
            ease: 'power2.out',
          });
          if (iconContainer) {
            gsap.to(iconContainer, {
              scale: 1,
              rotate: 0,
              backgroundColor: resolveCssColor('--brand', 0.08),
              color: 'var(--primary)',
              duration: 0.4,
            });
          }
        });
      });
    },
    containerRef,
    [items],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <section ref={containerRef} className="space-y-6">
      {}
      <div className="flex items-center gap-3 border-b border-hairline-strong pb-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Info className="size-5" />
        </span>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-ink uppercase font-display">
            Good to know
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            Important details, guidelines, and restrictions for attendees
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const MetaIcon = getMetaIcon(item.key);
          return (
            <div
              key={item.key}
              data-info-row
              className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card shadow-sm transition-all duration-300"
            >
              {}
              <div 
                data-info-icon-container
                className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary border border-primary/10 transition-all duration-300"
              >
                <MetaIcon className="size-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-ink font-display">
                  {humanize(item.key)}
                </h4>
                <p className="text-sm leading-relaxed text-body whitespace-pre-wrap">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
