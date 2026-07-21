import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';
import type { Persuasion } from '@/features/public/lib/persuasion';

interface PersuasionBandProps {
  persuasion: Persuasion;
  onGetTickets: () => void;
  cartCount: number;
}

export function PersuasionBand({ persuasion, onGetTickets, cartCount }: PersuasionBandProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: '-8px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const urgent = persuasion.heat === 'hot';
  const showSticky = stuck && cartCount === 0 && persuasion.heat !== 'soldOut';

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      <section
        aria-label="Grab your tickets"
        className="mx-auto mt-8 max-w-7xl px-4 md:px-8"
      >
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border p-6 md:p-8',
            urgent
              ? 'border-voltage/40 bg-voltage/10'
              : persuasion.heat === 'soldOut'
                ? 'border-hairline bg-surface-sunken'
                : 'border-brand/25 bg-brand/[0.06]',
          )}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-2.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider',
                  urgent
                    ? 'bg-voltage/20 text-voltage-ink'
                    : persuasion.heat === 'soldOut'
                      ? 'bg-ink/10 text-ink-soft'
                      : 'bg-brand/15 text-brand',
                )}
              >
                {urgent ? (
                  <Flame className={cn('size-3.5', 'ticketspan-urgent')} />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {persuasion.seatsLeft !== null && persuasion.seatsLeft > 0
                  ? `${persuasion.seatsLeft} ${persuasion.seatsLeft === 1 ? 'seat' : 'seats'} left`
                  : persuasion.startsInLabel
                    ? `Doors ${persuasion.startsInLabel}`
                    : 'On sale now'}
              </span>

              <h2 className="font-display text-2xl font-semibold leading-tight text-ink md:text-3xl">
                {persuasion.headline}
              </h2>
              <p className="text-sm leading-relaxed text-ink-soft md:text-base">
                {persuasion.subline}
              </p>

              <ul className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1">
                {persuasion.reassurance.map((r) => (
                  <li key={r} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                    <Check className="size-3.5 text-success" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="shrink-0">
              <Button onClick={onGetTickets} size="lg" className="group w-full md:w-auto">
                {persuasion.ctaLabel}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-brand/20 bg-surface/95 backdrop-blur-md transition-transform duration-300 ease-[var(--ease-out)]',
          showSticky ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
            {urgent ? (
              <Flame className="size-4 text-voltage-ink ticketspan-urgent" />
            ) : (
              <Sparkles className="size-4 text-brand" />
            )}
            <span className="truncate">{persuasion.stickyLabel}</span>
          </span>
          <Button onClick={onGetTickets} size="sm" className="shrink-0 px-6">
            {persuasion.ctaLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
