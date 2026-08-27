import { Link } from 'react-router-dom';
import type { Event } from '@/shared/proto/event';
import { imageUrl } from '@/shared/upload';
import { formatEventDate } from '@/shared/lib/format';
import { Countdown } from '@/features/public/components/discover/Countdown';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';

export function HeroEvent({ event }: { event: Event }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/90 shadow-[var(--shadow-e3)] transition-all duration-300">
      {}
      <div className="absolute inset-0 z-0">
        {event.primaryImageId ? (
          <img
            src={imageUrl(event.primaryImageId)}
            alt={event.title}
            className="h-full w-full object-cover opacity-40 transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-background to-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 size-96 rounded-full bg-accent/15 blur-3xl" />
      </div>

      {}
      <div className="relative z-10 flex min-h-[420px] flex-col justify-end gap-6 p-6 sm:p-10 md:min-h-[500px] md:p-14">
        {}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 font-mono text-[11px] font-semibold text-primary backdrop-blur-md">
            <Sparkles className="size-3.5" /> Featured Spotlight
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1 font-mono text-[11px] font-medium text-foreground backdrop-blur-md">
            <Calendar className="size-3.5 text-muted-foreground" />
            {formatEventDate(event.startDate)}
          </span>
          {event.category ? (
            <span className="rounded-full bg-muted/60 px-3 py-1 font-mono text-[11px] font-medium text-muted-foreground backdrop-blur-md">
              {event.category}
            </span>
          ) : null}
        </div>

        {}
        <div className="space-y-3">
          <h1 className="max-w-4xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            {event.title}
          </h1>
          {event.description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base line-clamp-2">
              {event.description}
            </p>
          ) : null}
        </div>

        {}
        <div className="mt-2 flex flex-col gap-6 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-3.5 backdrop-blur-md sm:p-4">
            <Countdown startEpoch={event.startDate} endEpoch={event.endDate} />
          </div>
          <Link
            to={`/events/${event.slug}`}
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/25 active:scale-[0.98] sm:w-auto"
          >
            <span>Book Tickets</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
