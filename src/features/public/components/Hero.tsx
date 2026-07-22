import { useEffect, useRef, useCallback } from 'react';
import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import type { Event } from '@/shared/proto/event';
import { imageUrl } from '@/shared/upload';
import { formatEventDate } from '@/shared/lib/format';
import { Countdown } from '@/features/public/components/discover/Countdown';
import { PriceBadge } from './PriceBadge';
import { AuroraBackground } from './AuroraBackground';
import { useLazyGsap } from '@/shared/motion/useLazyGsap';
import { useAsync } from '@/shared/hooks/useAsync';
import { getVenue } from '@/features/admin/services/catalogService';

interface HeroProps {
  event: Event;
  onGetTickets: () => void;
  minPriceCents?: number;
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  Open: 'General admission',
  Table: 'table seating',
  Both: 'Tickets & tables',
};

export function Hero({ event, onGetTickets, minPriceCents }: HeroProps) {
  const date = formatEventDate(event.startDate);
  const containerRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const venueLoader = useCallback(() => {
    return event.venuesId ? getVenue(event.venuesId) : Promise.resolve(null);
  }, [event.venuesId]);

  const { data: venue } = useAsync(venueLoader);

  const addressString = venue
    ? `${venue.line1 || ''} ${venue.line2 || ''}, ${venue.city || ''}, ${venue.state || ''} ${venue.zip || ''}`.trim()
    : '';
  const mapsSearchUrl = addressString
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`
    : venue?.name
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name)}`
    : '';

  useLazyGsap(
    ({ gsap }) => {
      const btn = buttonRef.current;
      if (!btn) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
      const onMove = (e: PointerEvent) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.5);
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };
      btn.addEventListener('pointermove', onMove);
      btn.addEventListener('pointerleave', onLeave);
      return () => {
        btn.removeEventListener('pointermove', onMove);
        btn.removeEventListener('pointerleave', onLeave);
      };
    },
    buttonRef,
  );

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches) return;
    let disposed = false;
    let ctx: { revert(): void } | undefined;
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (disposed || !imageRef.current) return;
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          const mm = gsap.matchMedia();
          mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.to(imageRef.current, {
              yPercent: 12,
              ease: 'none',
              scrollTrigger: {
                trigger: containerRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.6,
              },
            });
          });
          return () => mm.revert();
        }, containerRef);
      },
    );
    return () => {
      disposed = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      aria-label="Event introduction"
      className="relative w-full overflow-hidden bg-stage pb-16 pt-28 text-on-stage md:pb-24 md:pt-36"
    >
      <div className="absolute inset-0 select-none overflow-hidden">
        <AuroraBackground className="absolute inset-0 h-full w-full" />
        {event.primaryImageId ? (
          <img
            ref={imageRef}
            src={imageUrl(event.primaryImageId)}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="h-[115%] w-full scale-105 object-cover opacity-35 mix-blend-luminosity"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-stage via-stage/55 to-stage/10" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-7 px-4 md:px-8">
        <p data-hero-reveal style={{ animationDelay: '0ms' }} className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-voltage">
          {date}
          {event.category ? ` — ${event.category}` : ''}
        </p>

        <h1
          data-hero-reveal style={{ animationDelay: '60ms' }}
          className="max-w-4xl font-display text-4xl font-semibold leading-[1.02] md:text-6xl lg:text-7xl"
        >
          {event.title}
        </h1>

        {event.description ? (
          <p data-hero-reveal style={{ animationDelay: '120ms' }} className="max-w-2xl text-sm leading-relaxed text-on-stage-soft md:text-base line-clamp-3">
            {event.description}
          </p>
        ) : null}

        <div data-hero-reveal style={{ animationDelay: '180ms' }}>
          <Countdown startEpoch={event.startDate} endEpoch={event.endDate} />
        </div>

        <div
          data-hero-reveal style={{ animationDelay: '240ms' }}
          className="flex max-w-3xl flex-wrap gap-x-8 gap-y-3 border-y border-on-stage/15 py-5 text-sm"
        >
          {date ? (
            <span className="inline-flex items-center gap-2 text-on-stage-soft">
              <CalendarDays className="size-4 text-voltage" />
              {date}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2 text-on-stage-soft">
            <Ticket className="size-4 text-voltage" />
            {EVENT_TYPE_LABEL[event.eventType] || EVENT_TYPE_LABEL.Open}
          </span>
          {venue?.name ? (
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-on-stage-soft hover:text-voltage transition-colors hover:underline"
            >
              <MapPin className="size-4 text-voltage" />
              {venue.name}
            </a>
          ) : null}
        </div>

        <div data-hero-reveal style={{ animationDelay: '300ms' }} className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center">
          <button
            ref={buttonRef}
            onClick={onGetTickets}
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-[var(--shadow-e1)] transition-[background-color] duration-[180ms] ease-[var(--ease-out)] hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-stage"
          >
            Get tickets
            {minPriceCents !== undefined ? (
              <span className="font-normal opacity-90">
                · from <PriceBadge priceCents={minPriceCents} className="text-primary-foreground" />
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </section>
  );
}
