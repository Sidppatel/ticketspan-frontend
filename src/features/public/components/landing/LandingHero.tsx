import { HeroTicket } from '@/features/public/components/landing/LandingMockups';
import { useLandingStore, type VenueType } from '@/features/public/hooks/landingStore';
import { ArrowUpRight, Check, Sparkles, Building2 } from 'lucide-react';

const venueTypes: { type: VenueType; label: string }[] = [
  { type: 'club', label: 'Club & Lounge' },
  { type: 'theater', label: 'Theater & Arts' },
  { type: 'rooftop', label: 'Rooftop & Patio' },
  { type: 'supper club', label: 'Supper Club' },
];

const highlights = [
  'Zero monthly fees',
  'Direct 2-day payouts',
  'Tables & General Admission',
];

export function LandingHero() {
  const { venueName, venueType, setVenueName, setVenueType } = useLandingStore();

  return (
    <section className="relative pt-16 pb-8 sm:pt-20 sm:pb-12 md:pt-24 md:pb-14 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="flex flex-col items-start">
            <div data-hero-rise className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/15 bg-emerald-50 px-3 py-1 text-[11px] sm:text-xs font-semibold text-(--lp-green)">
              <span className="size-2 rounded-full bg-(--lp-green-accent)" />
              <span>Independent Venue Ticketing Platform</span>
            </div>

            <h1 data-hero-headline className="mt-4 sm:mt-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-(--lp-ink) leading-[1.1]">
              Sell tickets and tables under your own brand.
            </h1>

            <p data-hero-rise className="mt-3.5 sm:mt-5 text-sm sm:text-base md:text-lg leading-relaxed text-(--lp-ink-soft) max-w-xl">
              TicketSpan gives your room its own branded box office on its own custom domain. The service fee is paid at checkout by the buyer, so <strong className="font-semibold text-(--lp-ink)">a $50 ticket pays your bank account $50.00</strong>.
            </p>

            <div data-hero-rise className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <a
                href="#start"
                className="group flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-(--lp-green) px-5 sm:pl-6 sm:pr-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-emerald-950/15 transition-all hover:bg-(--lp-green-soft) active:scale-98"
              >
                <span>Create your branded box office</span>
                <span className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="size-3.5 sm:size-4" />
                </span>
              </a>

              <a
                href="#calculator"
                className="flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center rounded-full border border-stone-300 bg-white/80 px-5 sm:px-6 text-xs sm:text-sm font-semibold text-(--lp-ink) transition-colors hover:bg-white hover:border-stone-400"
              >
                Calculate your payout
              </a>
            </div>

            <div data-hero-rise className="mt-6 sm:mt-8 w-full max-w-lg rounded-2xl border border-stone-200/80 bg-white/90 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <label htmlFor="venue-simulator-input" className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-(--lp-ink)">
                  <Building2 className="size-3.5 text-(--lp-green)" />
                  <span>Preview your venue</span>
                </label>
                <span className="flex items-center gap-1 font-mono text-[10.5px] sm:text-[11px] text-stone-500">
                  <Sparkles className="size-3 text-emerald-600" />
                  Live pass update
                </span>
              </div>

              <div className="mt-2">
                <input
                  id="venue-simulator-input"
                  type="text"
                  value={venueName}
                  maxLength={40}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Skyline Terrace, The Grand Hall..."
                  className="lp-input font-medium text-xs sm:text-sm"
                  aria-label="Venue name preview"
                />
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1 sm:gap-1.5">
                {venueTypes.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setVenueType(item.type)}
                    className={`rounded-lg px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-[11px] sm:text-xs font-semibold transition-all ${
                      venueType === item.type
                        ? 'bg-(--lp-green) text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div data-hero-rise className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-stone-600">
              {highlights.map((point) => (
                <span key={point} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-(--lp-green)" />
                  <span>{point}</span>
                </span>
              ))}
            </div>
          </div>

          <div data-hero-ticket className="flex justify-center lg:justify-end w-full">
            <HeroTicket />
          </div>
        </div>
      </div>
    </section>
  );
}
