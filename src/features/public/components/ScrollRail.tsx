import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useDragScroll } from '@/shared/motion/useDragScroll';

interface RailState {
  canLeft: boolean;
  canRight: boolean;
  frac: number;
  pos: number;
}

export function ScrollRail({
  children,
  scrollerClassName,
  tone = 'light',
}: {
  children: ReactNode;
  scrollerClassName?: string;
  tone?: 'light' | 'dark';
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollRef);
  const [state, setState] = useState<RailState>({ canLeft: false, canRight: false, frac: 1, pos: 0 });

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setState({
      canLeft: el.scrollLeft > 2,
      canRight: el.scrollLeft < max - 2,
      frac: el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1,
      pos: max > 0 ? el.scrollLeft / max : 0,
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const nudge = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8 });
  };

  const scrollable = state.frac < 0.995;
  const isDark = tone === 'dark';
  const arrowBase =
    'absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border backdrop-blur transition disabled:pointer-events-none disabled:opacity-0';
  const arrowTone = isDark
    ? 'border-white/15 bg-stage/70 text-white hover:bg-stage/90'
    : 'border-border bg-surface/85 text-ink shadow-sm hover:bg-surface';
  const fadeFrom = isDark ? 'from-stage' : 'from-surface-canvas';

  return (
    <div>
      <div className="relative">
        <div
          ref={scrollRef}
          className={cn(
            'flex cursor-grab snap-x overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden active:cursor-grabbing',
            scrollerClassName,
          )}
        >
          {children}
        </div>

        {scrollable && (
          <>
            <div aria-hidden className={cn('pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r to-transparent md:w-12', fadeFrom)} />
            <div aria-hidden className={cn('pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l to-transparent md:w-12', fadeFrom)} />
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => nudge(-1)}
              disabled={!state.canLeft}
              className={cn(arrowBase, arrowTone, 'left-2')}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => nudge(1)}
              disabled={!state.canRight}
              className={cn(arrowBase, arrowTone, 'right-2')}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {scrollable && (
        <div className={cn('mx-5 mt-3 h-1 overflow-hidden rounded-full md:mx-8', isDark ? 'bg-white/10' : 'bg-border')}>
          <div
            className={cn('h-full rounded-full transition-[width] duration-150', isDark ? 'bg-accent-gold' : 'bg-brand')}
            style={{ width: `${Math.max(12, state.frac * 100)}%`, marginLeft: `${state.pos * (100 - Math.max(12, state.frac * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}
