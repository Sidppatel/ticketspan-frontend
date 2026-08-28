import { HeroTicket } from '@/features/public/components/landing/LandingMockups';
import { useLandingStore, type VenueType } from '@/features/public/hooks/landingStore';

const trustPoints = ['6.5% + $1.75 per order · buyer pays', 'Unlimited events', 'No monthly bill'];
const venueTypes: VenueType[] = ['club', 'theater', 'rooftop', 'supper club'];

export function LandingHero() {
  const { venueName, venueType, setVenueName, setVenueType } = useLandingStore();

  return (
    <section className="relative pt-16 md:pt-[4.5rem]">
      <div className="lp-rule-double relative mx-5 md:mx-8" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-16 pt-8 md:grid-cols-[1.2fr_0.8fr] md:gap-10 md:px-8 md:pb-24 md:pt-12">
        <div className="max-w-2xl">
          <p data-hero-rise className="lp-eyebrow text-(--lp-green)">
            White-label box office — built in Chickasaw, Alabama
          </p>
          <h1 data-hero-headline className="mt-7 text-4xl leading-tight text-(--lp-ink) md:text-5xl lg:text-6xl">
            Launch a branded ticketing site <em className="text-(--lp-green)">without changing your operations.</em>
          </h1>
          <p data-hero-rise className="lp-d1 mt-7 max-w-md text-base leading-relaxed text-(--lp-ink-soft) md:text-lg">
            Your venue gets its own box office on its own domain, wearing your colors. The service
            fee is added at checkout on the buyer&rsquo;s side, so{' '}
            <strong className="font-medium text-(--lp-ink)">a $50 ticket pays you $50</strong>.
            Tables, tickets, and the door list all live under your name.
          </p>
          <div data-hero-rise className="lp-d2 mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-7">
            <div className="flex flex-col gap-2.5">
              <a href="#start" data-magnet className="lp-cta text-center sm:text-left">
                Create your branded box office in 8 minutes — no card required
              </a>
              <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-(--lp-ink-soft) pl-1">
                Your path: Subdomain → Venue details → Stripe connect → First event
              </p>
            </div>
            <a href="#showcase" className="lp-ghost self-start sm:self-center">
              See it wearing your brand
            </a>
          </div>
          <div data-hero-rise className="lp-d3 mt-10 max-w-md border-t border-(--lp-line-soft) pt-6">
            <label className="block">
              <span className="lp-eyebrow text-(--lp-ink-soft)">Try it — what&rsquo;s your venue called?</span>
              <input
                type="text"
                value={venueName}
                maxLength={40}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Skyline Terrace"
                className="lp-input mt-3"
                aria-label="Type your venue name to preview it on the ticket"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="What kind of venue?">
              {venueTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVenueType(type)}
                  aria-pressed={venueType === type}
                  className={`border px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors ${
                    venueType === type
                      ? 'border-(--lp-green) bg-(--lp-green) text-(--lp-ivory)'
                      : 'border-(--lp-ink)/40 text-(--lp-ink-soft) hover:border-(--lp-ink)'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-(--lp-ink-faint)" aria-live="polite">
              {venueName.trim() ? 'That’s your ticket — look right →' : 'Watch the ticket redraw as you type'}
            </p>
          </div>
          <ul
            data-hero-rise
            className="lp-d3 mt-9 flex flex-wrap items-center gap-x-7 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-(--lp-ink-soft)"
          >
            {trustPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div data-hero-ticket className="flex justify-center md:justify-end md:pr-6">
          <HeroTicket />
        </div>
      </div>
    </section>
  );
}
