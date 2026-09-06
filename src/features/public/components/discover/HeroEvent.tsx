import { Link } from 'react-router-dom';
import type { Event } from '@/shared/proto/event';
import { imageUrl } from '@/shared/upload';
import { formatEventDate } from '@/shared/lib/format';
import { Countdown } from '@/features/public/components/discover/Countdown';
import { Sparkles, Calendar, ArrowRight, Ticket, Users } from 'lucide-react';
import { parseCatalogLinks } from '@/features/public/components/catalogJson';

export function HeroEvent({ event }: { event: Event }) {
  const performers = parseCatalogLinks(event.performersJson, 'performerId');
  const heroImage = event.heroBackdropImageId
    ? imageUrl(event.heroBackdropImageId)
    : event.primaryImageId
      ? imageUrl(event.primaryImageId)
      : '';

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-card p-2 shadow-[var(--shadow-e3)] transition-all duration-300">
      <div className="relative min-h-[460px] md:min-h-[520px] overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-muted p-6 sm:p-10 md:p-14 flex flex-col justify-end">
        <div className="absolute inset-0 z-0">
          {heroImage ? (
            <img
              src={heroImage}
              alt={event.title}
              className="h-full w-full object-cover opacity-45 transition-transform duration-700 ease-out hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-slate-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 size-96 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-md">
              <Sparkles className="size-3.5" /> Featured Spotlight
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3.5 py-1 font-mono text-[11px] font-medium text-white backdrop-blur-md">
              <Calendar className="size-3.5 text-primary" />
              {formatEventDate(event.startDate)}
            </span>
            {event.category ? (
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[11px] font-medium text-white/90 backdrop-blur-md">
                {event.category}
              </span>
            ) : null}
            {event.urgencyBadgeText ? (
              <span className="rounded-full border border-rose-500/40 bg-rose-500/20 px-3 py-1 font-mono text-[11px] font-bold text-rose-300 backdrop-blur-md">
                {event.urgencyBadgeText}
              </span>
            ) : null}
          </div>

          <div className="space-y-3">
            <h2 className="max-w-4xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              {event.title}
            </h2>
            {event.shortDescription || event.description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base line-clamp-2">
                {event.shortDescription || event.description}
              </p>
            ) : null}
          </div>

          {performers.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="font-mono text-xs font-semibold text-white/70 uppercase tracking-wider inline-flex items-center gap-1">
                <Users className="size-3.5 text-primary" /> Featuring:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {performers.slice(0, 4).map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-[11px] font-medium text-white backdrop-blur-md"
                  >
                    {p.name}
                  </span>
                ))}
                {performers.length > 4 && (
                  <span className="font-mono text-xs text-white/60">
                    +{performers.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-6 pt-3 sm:flex-row sm:items-end sm:justify-between border-t border-white/15">
            <div className="rounded-2xl border border-white/20 bg-black/60 p-3.5 backdrop-blur-md sm:p-4">
              <Countdown startEpoch={event.startDate} endEpoch={event.endDate} />
            </div>

            <Link
              to={`/events/${event.slug}`}
              className="group inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground shadow-xl transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98] sm:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                <Ticket className="size-4" /> Secure Tickets &amp; Passes
              </span>
              <span className="flex size-7 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
