import { CalendarDays, MapPin, Ticket, ShieldCheck, Flame, Clock, Sparkles } from 'lucide-react';
import type { Event } from '@/shared/proto/event';
import { imageUrl } from '@/shared/upload';
import { formatEventDate } from '@/shared/lib/format';
import { PriceBadge } from '../PriceBadge';
import { AuroraBackground } from '../AuroraBackground';
import { Countdown } from '../discover/Countdown';
import { useAsync } from '@/shared/hooks/useAsync';
import { getVenue } from '@/features/admin/services/catalogService';
import { useCallback } from 'react';

interface BentoHeaderProps {
  event: Event;
  onGetTickets: () => void;
  minPriceCents?: number;
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  Open: 'General admission',
  Table: 'Table seating',
  Both: 'Tickets & tables',
};

export function BentoHeader({ event, onGetTickets, minPriceCents }: BentoHeaderProps) {
  const dateStr = formatEventDate(event.startDate);

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

  const backdropImageId = event.heroBackdropImageId || event.primaryImageId;
  const posterImageId = event.posterImageId || event.primaryImageId;
  const heroDescription = event.shortDescription || event.description;
  const urgencyLabel = event.urgencyBadgeText || 'High Demand';
  const showVerified = event.isVerifiedOrganizer !== false;

  return (
    <section aria-label="Event Hero Section" className="relative w-full overflow-hidden bg-stage pb-12 pt-20 text-on-stage md:pb-16 md:pt-24">
      <div className="absolute inset-0 select-none overflow-hidden">
        <AuroraBackground className="absolute inset-0 h-full w-full" />
        {backdropImageId && (
          <img
            src={imageUrl(backdropImageId)}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="h-[110%] w-full object-cover opacity-65 filter blur-[1px] scale-105 transition-all duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-stage/40 via-stage/75 to-surface-canvas" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-voltage/20 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-voltage border border-voltage/40 backdrop-blur-md shadow-sm">
              <Flame className="size-3.5 text-voltage animate-pulse" /> {urgencyLabel}
            </span>
            {event.category && (
              <span className="rounded-full bg-white/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white border border-white/15 backdrop-blur-md">
                {event.category}
              </span>
            )}
            {showVerified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3.5 py-1 font-sans text-[11px] font-bold text-emerald-400 border border-emerald-500/40 backdrop-blur-md">
                <ShieldCheck className="size-3.5 text-emerald-400" /> Verified Organizer
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-voltage">
            <Sparkles className="size-3.5 text-voltage" /> Official Event Pass
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-black/60 p-3 shadow-2xl backdrop-blur-xl">
              {posterImageId ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                  <img
                    src={imageUrl(posterImageId)}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white font-mono text-xs">
                    <span className="rounded-xl bg-black/80 px-3 py-1.5 backdrop-blur-md border border-white/20 font-bold">
                      {EVENT_TYPE_LABEL[event.eventType] || EVENT_TYPE_LABEL.Open}
                    </span>
                    <span className="rounded-xl bg-voltage/90 px-3 py-1.5 backdrop-blur-md text-black font-extrabold uppercase">
                      Live Pass
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-stage via-surface-card to-surface-sunken p-6 text-center">
                  <Ticket className="size-16 text-voltage/40" />
                </div>
              )}

              <div className="mt-3 rounded-2xl bg-black/80 p-4 border border-white/15 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-voltage flex items-center gap-1">
                    <Clock className="size-3" /> Time Remaining
                  </span>
                  <span className="text-[10px] font-mono text-white/60 uppercase">Starts Soon</span>
                </div>
                <Countdown startEpoch={event.startDate} endEpoch={event.endDate} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div className="space-y-3">
              <h1 className="font-display text-3xl font-black leading-[1.02] tracking-tight sm:text-5xl md:text-6xl text-white">
                {event.title}
              </h1>

              {heroDescription && (
                <p className="max-w-xl text-sm leading-relaxed text-white/80 md:text-base font-normal line-clamp-3">
                  {heroDescription}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 font-semibold text-xs text-white">
              {dateStr && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-black/80 px-4 py-3 backdrop-blur-xl border border-white/25 shadow-md">
                  <CalendarDays className="size-4 text-voltage shrink-0" />
                  <span className="font-bold tracking-wide text-white">{dateStr}</span>
                </div>
              )}
              {venue?.name && (
                <a
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-2xl bg-black/80 px-4 py-3 backdrop-blur-xl border border-white/25 shadow-md hover:bg-black/95 hover:border-voltage transition-all text-white"
                >
                  <MapPin className="size-4 text-voltage shrink-0" />
                  <span className="font-bold tracking-wide text-white">{venue.name}</span>
                </a>
              )}
            </div>

            <div className="rounded-3xl border border-white/20 bg-black/85 p-6 backdrop-blur-2xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[11px] uppercase font-mono tracking-wider text-white/70">Passes starting from</span>
                  {minPriceCents !== undefined ? (
                    <PriceBadge priceCents={minPriceCents} className="font-mono text-3xl font-black text-white" />
                  ) : (
                    <span className="font-mono text-xl font-bold text-white">Check Tiers</span>
                  )}
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] text-voltage font-mono font-bold">
                    <Clock className="size-3" /> Live Inventory
                  </span>
                  <span className="block text-[10px] text-white/60 font-sans">Instant Mobile Delivery</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onGetTickets}
                className="w-full h-14 cursor-pointer rounded-2xl bg-brand text-brand-ink font-extrabold text-base uppercase tracking-wider shadow-xl hover:bg-brand-hover active:scale-98 transition-all flex items-center justify-center gap-2.5"
              >
                <Ticket className="size-5" />
                Select Event Passes
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
